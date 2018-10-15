import { Observable } from 'rxjs';
import { CoreModule, Extension, ExtensionWithConfig, BootstrapOptions, ExtensionShutdown } from './interfaces';
import { InternalLogger } from './logger';
import { Type } from './decorators';
import { ExtentionHooksEnum, ModuleEnum, ModuleLevel } from './enums';
import { ModuleManager } from './module';
import { HookManager } from './hook';
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
                .flatMap(_ => ModuleManager.resolve(_))
                .flatMap(_ => this.loadExtensions(extensions, _, options))
                .ignoreElements()
                .subscribe(
                    null,
                    _ => {
                        this.logger.debug(`bootstrap error caught [${_.message}]`);
                        this
                            .shutdown()
                            .subscribe(
                                () => reject(_),
                                err => {
                                    this.logger.debug(`bootstrap error caught [${err.message}], shutting down extensions...`);
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
            .flatMap(_ => this
                .shutdownUtils
                .shutdown(_)
            );
    }

    private static handleShutdownSignals(): void {
        this
            .shutdownUtils
            .events$
            .flatMap(_ => this.shutdown())
            .subscribe(
                _ => {
                    this.logger.debug('process shutdown triggered');
                    process.exit(0);
                 } ,
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
        return Observable
            .from([].concat(this.extensions).filter(e => !!e))
            .filter(_ => !!_ && HookManager
                .hasLifecycleHook(
                    ExtentionHooksEnum.OnShutdown.toString(),
                    _.token
                )
            )
            .flatMap(_ => HookManager
                .triggerHook(
                    ExtentionHooksEnum.OnShutdown.toString(),
                    _.token,
                    _.instance,
                    [module, _.value]
                )
            )
            .toArray();
    }

    /**
     * Load extensions
     *
     * @param  {Array<Type<any>|ExtensionWithConfig>} extensions
     * @param  {CoreModule} moduleResolved
     * @param  {BootstrapOptions} options?
     * @returns Observable
     */
    private static loadExtensions(extensions:  Array<Type<any> | ExtensionWithConfig>, moduleResolved: CoreModule,
            options: BootstrapOptions): Observable<void> {
        return Observable
            .from([].concat(extensions).filter(_ => !!_))
            .map(_ => this.toExtensionWithConfig(_))
            .concatMap(_ => this
                .loadExtention(_, moduleResolved, options)
                .catch(err => Observable.throw(extensionError(err, _.token.name)))
            )
            .toArray()
            .flatMap(_ => this.instantiateModule(_, moduleResolved, options));
    }

    /**
     * Instantiate module
     *
     * @param  {Extension[]} extensionsLoaded
     * @param  {CoreModule} moduleResolved
     * @returns Observable
     */
    private static instantiateModule(extensionsLoaded: Extension[], moduleResolved: CoreModule,
            options: BootstrapOptions): Observable<void> {
        return Observable
            .from(extensionsLoaded)
            .map(_ => ({ provide: _.token, useValue: _.value }))
            .toArray()
            .flatMap(_ => ModuleManager.instantiate(moduleResolved, _))
            .flatMap(_ => this.callRegister(_))
            .flatMap(moduleInstantiated =>
                Observable
                    .from(extensionsLoaded)
                    .flatMap(_ => this
                        .moduleInstantiated(_, moduleInstantiated)
                        .timeout(options.extensionTimeout || this.defaultTimeout)
                        .catch(err => Observable.throw(extensionError(err, _.token.name)))
                    )
                    .toArray()
                    .map(_ => moduleInstantiated)
            )
            .do(_ => this.module = _)
            .flatMap(_ => this.callStart(_));
    }

    /**
     * Call Register Hooks
     *
     * @param  {CoreModule} moduleInstantiated
     * @returns Observable
     */
    private static callRegister(moduleInstantiated: CoreModule): Observable<CoreModule> {
        return Observable
            .from(ModuleManager.getModules(moduleInstantiated))
            .filter(_ => _.level !== ModuleLevel.ROOT)
            .filter(_ => HookManager
                .hasLifecycleHook(ModuleEnum.OnRegister.toString(), _.token)
            )
            .flatMap(_ => HookManager
                .triggerHook(ModuleEnum.OnRegister.toString(), _.token, _.instance)
            )
            .toArray()
            .map(_ => moduleInstantiated)
    }

    /**
     * Call Start Hooks
     *
     * @param  {CoreModule} moduleInstantiated
     * @returns Observable
     */
    private static callStart(moduleInstantiated: CoreModule): Observable<void> {
        return Observable
            .of(moduleInstantiated)
            .flatMap(_ => HookManager
                .triggerHook(
                    ModuleEnum.OnStart.toString(),
                    moduleInstantiated.token,
                    moduleInstantiated.instance,
                    null,
                    false
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
        return Observable
            .of(module)
            .do(_ => this.module = null)
            .do(_ => this.extensions = null)
            .flatMap(_ => !!_ ?
                Observable.of(_) :
                Observable.throw(new Error('Bootstrap failed: no module provided'))
            )
            .flatMap(_ => typeof _ === 'function' ?
                Observable.of(_) :
                Observable.throw(new Error('Bootstrap failed: module must be a function/class'))
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
     * @returns Observable
     */
    private static loadExtention(extension: ExtensionWithConfig, module: CoreModule, options: BootstrapOptions): Observable<Extension> {
        return Observable
            .of(Reflect.construct(extension.token, []))
            .do(_ => this.logger.debug(`loading ${extension.token.name}`))
            .switchMap(instance =>
                HookManager
                    .triggerHook(
                        ExtentionHooksEnum.OnExtensionLoad.toString(),
                        extension.token,
                        instance,
                        [ module, extension.config ]
                    )
                    .timeout(options.extensionTimeout || this.defaultTimeout)
                    .catch(_ => {
                        setTimeout(() => process.exit(1), 1000);
                        return Observable.throw(_);
                    })
            )
            .do(_ => this.extensions = []
                .concat(this.extensions, _)
                .filter(__ => !!__)
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
            .do(_ => this.logger.debug(`moduleInstantiated ${extension.token.name}`))
            .defaultIfEmpty(null);
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
    Observable
        .of(Hapiness['module'])
        .filter(_ => !!(_ && _.instance))
        .flatMap(_ =>
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
                Observable
                    .throw(error)
        )
        .subscribe(null, _ => console.error(_));
}
