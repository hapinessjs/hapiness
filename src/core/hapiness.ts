import { from, Observable, of, throwError } from 'rxjs';
import {
    catchError,
    concatMap,
    defaultIfEmpty,
    filter,
    flatMap,
    ignoreElements,
    map,
    switchMap,
    tap,
    timeout,
    toArray
} from 'rxjs/operators';
import { Type } from './decorators';
import { ExtentionHooksEnum, ModuleEnum, ModuleLevel } from './enums';
import { HookManager } from './hook';
import { BootstrapOptions, CoreModule, Extension, ExtensionShutdown, ExtensionWithConfig } from './interfaces';
import { InternalLogger } from './logger';
import { ModuleManager } from './module';
import { ShutdownUtils } from './shutdown';

function extensionError(error: Error, name: string): Error {
    error.message = `[${name}] ${error.message}`;
    return error;
}

export class Hapiness {

    private static module: CoreModule;
    private static extensions: Extension[];
    private static logger = new InternalLogger('bootstrap');
    private static shutdownUtils = new ShutdownUtils();
    private static defaultTimeout = 5000;

    /**
     * Entrypoint to bootstrap a module
     * will load the extentions and trigger
     * module's hooks
     *
     * @param  {Type<any>} module
     * @param  {Array<Type<any>|ExtensionWithConfig>} extensions?
     * @param  {BootstrapOptions} options?
     * @returns Promise
     */
    public static bootstrap(module: Type<any>, extensions?: Array<Type<any> | ExtensionWithConfig>,
                            options: BootstrapOptions = {}): Promise<void> {

        if (options.shutdown !== false) {
            this.handleShutdownSignals();
        }
        return new Promise((resolve, reject) => {
            this
                .checkArg(module)
                .pipe(
                    flatMap(_ => ModuleManager.resolve(_)),
                    flatMap(_ => this.loadExtensions(extensions, _, options)),
                    ignoreElements()
                )
                .subscribe(
                    null,
                    _ => {
                        this.logger.debug(`bootstrap error catched [${_.message}]`);
                        this
                            .shutdown()
                            .subscribe(
                                () => reject(_),
                                err => {
                                    this.logger.debug(`bootstrap error catched [${err.message}], shutting down extensions...`);
                                    reject(err);
                                    process.exit(1);
                                }
                            );
                    },
                    () => resolve()
                );
        });
    }

    /**
     * Force a shutdown
     *
     * @returns Observable
     */
    public static shutdown(): Observable<boolean> {
        return this
            .getShutdownHooks()
            .pipe(
                flatMap(_ => this.shutdownUtils.shutdown(_))
            );
    }

    private static handleShutdownSignals(): void {
        this
            .shutdownUtils
            .events$
            .pipe(
                flatMap(_ => this.shutdown())
            )
            .subscribe(
                _ => {
                    this.logger.debug('process shutdown triggered');
                    process.exit(0);
                },
                _ => {
                    errorHandler(_);
                    process.exit(1);
                }
            );
    }

    /**
     * Retrieve all shutdown hooks
     *
     * @returns ExtensionShutdown[]
     */
    private static getShutdownHooks(): Observable<ExtensionShutdown[]> {
        return from([].concat(this.extensions).filter(e => !!e))
            .pipe(
                filter(_ => !!_ && HookManager
                    .hasLifecycleHook(
                        ExtentionHooksEnum.OnShutdown.toString(),
                        _.token
                    )
                ),
                flatMap(_ => HookManager
                    .triggerHook(
                        ExtentionHooksEnum.OnShutdown.toString(),
                        _.token,
                        _.instance,
                        [ module, _.value ]
                    )
                ),
                toArray()
            );
    }

    /**
     * Load extensions
     *
     * @param  {Array<Type<any>|ExtensionWithConfig>} extensions
     * @param  {CoreModule} moduleResolved
     * @param  {BootstrapOptions} options?
     * @returns Observable
     */
    private static loadExtensions(extensions: Array<Type<any> | ExtensionWithConfig>, moduleResolved: CoreModule,
                                  options: BootstrapOptions): Observable<void> {
        return from([].concat(extensions).filter(_ => !!_))
            .pipe(
                map(_ => this.toExtensionWithConfig(_)),
                concatMap(_ => this
                    .loadExtention(_, moduleResolved)
                    .pipe(
                        timeout(options.extensionTimeout || this.defaultTimeout),
                        catchError(err => throwError(extensionError(err, _.token.name)))
                    )
                ),
                toArray(),
                flatMap(_ => this.instantiateModule(_, moduleResolved, options))
            );
    }

    /**
     * Instantiate module
     *
     * @param  {Extension[]} extensionsLoaded
     * @param  {CoreModule} moduleResolved
     * @param  {BootstrapOptions} options
     * @returns Observable
     */
    private static instantiateModule(extensionsLoaded: Extension[], moduleResolved: CoreModule,
                                     options: BootstrapOptions): Observable<void> {
        return from(extensionsLoaded)
            .pipe(
                map(_ => ({ provide: _.token, useValue: _.value })),
                toArray(),
                flatMap(_ => ModuleManager.instantiate(moduleResolved, _)),
                flatMap(_ => this.callRegister(_)),
                flatMap(moduleInstantiated =>
                    from(extensionsLoaded)
                        .pipe(
                            flatMap(_ => this
                                .moduleInstantiated(_, moduleInstantiated)
                                .pipe(
                                    timeout(options.extensionTimeout || this.defaultTimeout),
                                    catchError(err => throwError(extensionError(err, _.token.name)))
                                )
                            ),
                            toArray(),
                            map(_ => moduleInstantiated)
                        )
                ),
                tap(_ => this.module = _),
                flatMap(_ => this.callStart(_))
            );
    }

    /**
     * Call Register Hooks
     *
     * @param  {CoreModule} moduleInstantiated
     * @returns Observable
     */
    private static callRegister(moduleInstantiated: CoreModule): Observable<CoreModule> {
        return from(ModuleManager.getModules(moduleInstantiated))
            .pipe(
                filter(_ => _.level !== ModuleLevel.ROOT),
                filter(_ => HookManager
                    .hasLifecycleHook(ModuleEnum.OnRegister.toString(), _.token)
                ),
                flatMap(_ => HookManager
                    .triggerHook(ModuleEnum.OnRegister.toString(), _.token, _.instance)
                ),
                toArray(),
                map(_ => moduleInstantiated)
            );
    }

    /**
     * Call Start Hooks
     *
     * @param  {CoreModule} moduleInstantiated
     * @returns Observable
     */
    private static callStart(moduleInstantiated: CoreModule): Observable<void> {
        return of(moduleInstantiated)
            .pipe(
                flatMap(_ => HookManager
                    .triggerHook(
                        ModuleEnum.OnStart.toString(),
                        _.token,
                        _.instance,
                        null,
                        false
                    )
                )
            );
    }

    /**
     * Check if the provided module
     * is right
     *
     * @param  {Type<any>} module
     * @returns Observable
     */
    private static checkArg(module: Type<any>): Observable<Type<any>> {
        return of(module)
            .pipe(
                tap(_ => this.module = null),
                tap(_ => this.extensions = null),
                flatMap(_ => !!_ ?
                    of(_) :
                    throwError(new Error('Bootstrap failed: no module provided'))
                ),
                flatMap(_ => typeof _ === 'function' ?
                    of(_) :
                    throwError(new Error('Bootstrap failed: module must be a function/class'))
                )
            );
    }

    /**
     * Convert an extension type to ExtensionWithConfig
     *
     * @param  {} extension
     * @returns ExtensionWithConfig
     */
    private static toExtensionWithConfig(extension): ExtensionWithConfig {
        if (extension && <ExtensionWithConfig>extension.token) {
            return <ExtensionWithConfig>extension;
        }
        return {
            token: <Type<any>>extension,
            config: {}
        };
    }

    /**
     * Call the OnExtensionLoad hook
     * of an extension
     *
     * @param  {ExtensionWithConfig} extension
     * @param  {CoreModule} module
     * @returns Observable
     */
    private static loadExtention(extension: ExtensionWithConfig, module: CoreModule): Observable<Extension> {
        return of(Reflect.construct(extension.token, []))
            .pipe(
                tap(_ => this.logger.debug(`loading ${extension.token.name}`)),
                switchMap(instance =>
                    HookManager
                        .triggerHook(
                            ExtentionHooksEnum.OnExtensionLoad.toString(),
                            extension.token,
                            instance,
                            [ module, extension.config ]
                        )
                        .pipe(
                            catchError(_ => {
                                this.extensions = [].concat(this.extensions, instance);
                                return this
                                    .shutdown()
                                    .pipe(
                                        flatMap(() => throwError(_))
                                    );
                            })
                        )
                ),
                tap(_ => this.extensions = [].concat(this.extensions, _).filter(__ => !!__))
            );
    }

    /**
     * Call the OnModuleInstantiated hook
     * of an extension
     *
     * @param  {Extension} extension
     * @returns Observable
     */
    private static moduleInstantiated(extension: Extension, module: CoreModule): Observable<void> {
        return HookManager
            .triggerHook(
                ExtentionHooksEnum.OnModuleInstantiated.toString(),
                extension.token,
                extension.instance,
                [ module, extension.value ]
            )
            .pipe(
                tap(_ => this.logger.debug(`moduleInstantiated ${extension.token.name}`)),
                defaultIfEmpty(null)
            );
    }

}

/**
 * Error handler
 * Call onError of Root module
 * Or log in console
 *
 * @param  {Error} error
 * @param  {any} data
 * @returns void
 */
export function errorHandler(error: Error, data?: any): void {
    of(Hapiness[ 'module' ])
        .pipe(
            filter(_ => !!(_ && _.instance)),
            flatMap(_ =>
                HookManager
                    .hasLifecycleHook(ModuleEnum.OnError.toString(), _.token) ?
                    HookManager
                        .triggerHook(
                            ModuleEnum.OnError.toString(),
                            _.token,
                            _.instance,
                            [ error, data ],
                            false
                        ) :
                    throwError(error)
            )
        )
        .subscribe(null, _ => console.error(_));
}
