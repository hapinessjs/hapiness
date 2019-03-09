import { Extension, ExtensionWithConfig, TokenExt, ExtensionToLoad, ExtensionResult,
    TokenDI, ExtensionConfig, ExtensionLogger, ExtensionShutdown } from './extensions';
import { map, tap, flatMap, concatMap, toArray, filter, mapTo, ignoreElements, retryWhen, delay, scan,
        timeout, catchError } from 'rxjs/operators';
import { Tracer } from 'opentracing';
import { Type } from './decorators';
import { ModuleManager } from './module';
import { CoreModule, CoreProvide } from './interfaces';
import { Observable, from, throwError, of, empty, isObservable } from 'rxjs';
import { ReflectiveInjector } from 'injection-js';
import { DependencyInjection } from './di';
import { HookManager } from './hook';
import { ExtensionHooksEnum, ModuleLevel, ModuleEnum, ExtensionShutdownPriority, ExtensionType } from './enums';
import { extractMetadataAndName } from './metadata';
import { InternalLogger } from './logger';
import { arr } from './utils';
import * as Url from 'url';

/**
 * State of an Hapiness instance
 * Contains the root module and the
 * extensions.
 */
class CoreState {
    extensions: ExtensionResult<any>[] = [];
    module: CoreModule;
    internal_logger = new InternalLogger('bootstrap');
    logger(): ExtensionLogger {
        const logger = this.extensions.find(ext => ext.token['type'] === ExtensionType.LOGGING);
        return logger ? logger.value : this.internal_logger;
    }
}

type ExtensionShutdownMap = ExtensionShutdown & { extension: ExtensionResult<any> };

export interface BootstrapOptions {
    tracer?: Tracer;
    retry?: {
        interval?: number,
        count?: number
    };
    timeout?: number;
}

/**
 * Hapiness static class
 * Allow to bootstrap/shutdown a Module
 */
export class Hapiness {

    private static state: CoreState;

    /**
     * Bootstrap a Module with a set of extensions
     */
    static bootstrap(module: Type<any>, extensions?: ExtensionToLoad<any>[], options?: BootstrapOptions) {
        this.state = new CoreState();
        process.once('SIGTERM', () => this.shutdown());
        process.once('SIGINT', () => this.shutdown());
        return bootstrap(this.state, module, extensions, options);
    }

    /**
     * Shutdown the Module that has already been bootstrap
     */
    static shutdown() {
        return shutdown(this.state).toPromise();
    }
}

/**
 * Error Handler
 * Use the `onError` hook from the root module.
 * If there is not, it will just log.
 */
export function errorHandler(error: Error, data?: any): void {
    of(Hapiness['state'].module).pipe(
        filter(module => module && module.instance),
        flatMap(module => HookManager.hasLifecycleHook(ModuleEnum.OnError.toString(), module.token) ?
            HookManager.triggerHook(ModuleEnum.OnError.toString(), module.token, module.instance, [ error, data ]) :
            throwError(error)
        )
    )
    .subscribe(null, console.log);
}

/**
 * `bootstrap` function
 * Entry point to load a Module
 * Will load and build the extensions provided
 */
function bootstrap(state: CoreState, module: Type<any>, extensions?: ExtensionToLoad<any>[], options?: BootstrapOptions) {
    if (!module || typeof module !== 'function') {
        return Promise.reject(new Error('You have to provide a module'));
    }
    extensions = extensions || [];
    // TODO MAKE SURE TO HAVE ALWAYS DEFAULT VALUES
    const opts = { timeout: 5000, retry: { count: 3, interval: 3000 }, ...options };
    opts.tracer = opts.tracer || new Tracer();
    return new Promise((resolve, reject) => {
        ModuleManager.resolve(module).pipe(
            tap(coreModule => state.module = coreModule),
            flatMap(() => loadExtensions(extensions, state, opts)),
            tap(() => state.logger().info('--- extensions loaded.')),
            flatMap(extensionResults => instantiateModule(extensionResults, state)),
            tap(() => state.logger().info('--- modules instantiated and registered.')),
            flatMap(() => buildExtensions(state, opts)),
            tap(() => state.logger().info('--- extensions built. starting...')),
            flatMap(() => callStart(state)),
            tap(() => state.logger().info('--- hapiness is running')),
            ignoreElements()
        )
        .subscribe(
            null,
            err => { reject(err); shutdown(state).subscribe(); },
            () => resolve()
        );
    });
}

function convertToExtensionWithConfig<T>(extension: TokenExt<T> | ExtensionWithConfig<T>): ExtensionWithConfig<T> {
    if (extension && extension['token']) {
        return <ExtensionWithConfig<T>>extension;
    }
    return {
        token: <TokenExt<T>>extension,
        config: {}
    };
}

function buildDIForExtension<T>(extension: ExtensionWithConfig<T>, state: CoreState): Observable<ReflectiveInjector> {
    const providers = arr(state.extensions)
        .filter(ext => ext.token['type'] !== ExtensionType.DEFAULT)
        .map(ext => (<CoreProvide>{ provide: TokenDI(ext.token['type'].toString()), useValue: ext.value }));
    return DependencyInjection.createAndResolve(arr(providers)
        .concat([
            { provide: ExtensionConfig, useValue: { ...extension.config, extension_name: extension.token.name } },
            { provide: ExtensionLogger, useClass: ExtensionLogger }
        ])
    );
}

function findLoggingExtension(state: CoreState): ExtensionResult<any> | null {
    return state.extensions.find(e => e.token['type'] === ExtensionType.LOGGING);
}

function formatConfig(config: ExtensionConfig): string {
    if (config.uri) {
        return Url.parse(config.uri).host;
    } else if (config.host) {
        return config.host + (config.port ? `:${config.port}` : '');
    }
}

function logExt<T>(level: string, instance: Extension<T>, message: string): void {
    if (instance && instance.logger) {
        instance.logger[level](`[${instance.constructor.name}]: ${message}`);
    }
}

function loadExtension<T>(extension: ExtensionWithConfig<T>, di: ReflectiveInjector, state: CoreState,
        options: BootstrapOptions): Observable<ExtensionResult<T>> {
    return of(<Extension<T>>Reflect.apply((<any>extension.token).instantiate, extension.token, [di])).pipe(
        tap(instance => logExt('info', instance, `loading the extension` +
            `${formatConfig(instance.config) ? `, using ${formatConfig(instance.config)}` : ''}`)),
        flatMap(instance => HookManager
            .triggerHook<Extension<T>, ExtensionResult<T>>(
                ExtensionHooksEnum.OnLoad.toString(),
                extension.token,
                instance,
                [ state.module ]
            ).pipe(
                timeout(options.timeout),
                retryWhen(errors => errors.pipe(
                    scan((c, err: Error) => {
                        logExt('error', instance, `Retry (${c + 1}): ${err.message}`);
                        if (c >= (options.retry.count - 1)) { throw err; }
                        return c + 1;
                    }, 0),
                    delay(options.retry.interval),
                ))
            )
        )
    );
}

function loadExtensions(extensions: ExtensionToLoad<any>[], state: CoreState,
        options: BootstrapOptions): Observable<ExtensionResult<any>[]> {
    return from(arr(extensions)
        .map(ext => convertToExtensionWithConfig(ext))
        .sort((a, b) => b.token['type'] - a.token['type'])
    ).pipe(
        flatMap(ext =>
            ext.token['type'] === ExtensionType.LOGGING && !!findLoggingExtension(state) ?
                throwError(new Error(`Logging extension already loaded: ${findLoggingExtension(state).token.name}`)) :
                of(ext)
        ),
        concatMap(ext => buildDIForExtension(ext, state).pipe(
            flatMap(di => loadExtension(ext, di, state, options)),
            tap(extRes => state.extensions.push(extRes))
        )),
        toArray()
    );
}

function callStart(state: CoreState): Observable<void> {
    return of(state.module).pipe(
        flatMap(coreModule => HookManager
            .triggerHook<Type<any>, void>(
                ModuleEnum.OnStart.toString(),
                coreModule.token,
                coreModule.instance,
                null,
                false
            )
        )
    );
}

function callRegister(coreModule: CoreModule): Observable<CoreModule> {
    return from(ModuleManager.getModules(coreModule)).pipe(
        filter(module => module.level !== ModuleLevel.ROOT),
        filter(module => HookManager
            .hasLifecycleHook(ModuleEnum.OnRegister.toString(), module.token)),
        flatMap(module => HookManager
            .triggerHook(ModuleEnum.OnRegister.toString(), module.token, module.instance)
        ),
        toArray(),
        mapTo(coreModule)
    );
}

function instantiateModule(extensions: ExtensionResult<any>[], state: CoreState): Observable<CoreModule> {
    return from(extensions).pipe(
        map(ext => ({ provide: ext.token, useValue: ext.value })),
        toArray(),
        flatMap(extProviders => ModuleManager.instantiate(state.module, extProviders)),
        tap(coreModule => state.module = coreModule),
        flatMap(coreModule => callRegister(coreModule))
    );
}

function buildExtension<T>(extension: ExtensionResult<T>, state: CoreState, options: BootstrapOptions): Observable<void> {
    const decorators = extension.instance.decorators || [];
    const metadata = ModuleManager.getModules(state.module)
        .map(module => module.declarations)
        .reduce((a, c) => a.concat(c), <any>[])
        .map(components => extractMetadataAndName(components))
        .filter(data => decorators.indexOf(data.name) > -1);
    logExt('info', extension.instance, `building the extension.`);
    return HookManager
        .triggerHook<Extension<T>, void>(
            ExtensionHooksEnum.OnBuild.toString(),
            extension.token,
            <any>extension.instance,
            [ state.module, metadata ]
        ).pipe(
            timeout(options.timeout),
            retryWhen(errors => errors.pipe(
                delay(options.retry.interval),
                scan((c, err: Error) => {
                    logExt('error', extension.instance, `Retry (${c + 1}): ${err.message}`);
                    if (c >= (options.retry.count - 1)) { throw err; }
                    return c + 1;
                }, 0)
            ))
        );
}

function buildExtensions(state: CoreState, options: BootstrapOptions): Observable<void> {
    return from(state.extensions).pipe(
        flatMap(ext => buildExtension(ext, state, options)),
        toArray(),
        mapTo(undefined)
    );
}

function getShutdownHooks(state: CoreState): Observable<ExtensionShutdownMap[]> {
    return from(arr(state.extensions)).pipe(
        filter(ext => !!ext && HookManager
            .hasLifecycleHook(
                ExtensionHooksEnum.OnShutdown.toString(),
                ext.token
            )
        ),
        flatMap(ext => HookManager
            .triggerHook<Extension<any>, ExtensionShutdown>(
                ExtensionHooksEnum.OnShutdown.toString(),
                ext.token,
                ext.instance,
                [ state.module ]
            ).pipe(
                map(res => ({ extension: ext, ...res })),
                timeout(100),
                catchError(() => empty())
            )
        ),
        toArray()
    );
}

function shutdown(state: CoreState): Observable<void> {
    state.logger().warn('shutdown has been triggered');
    return getShutdownHooks(state).pipe(
        flatMap(hooks => from(hooks).pipe(
            filter(hook => hook.priority === ExtensionShutdownPriority.IMPORTANT),
            tap(hook => logExt('info', hook.extension.instance, 'shutdown.')),
            flatMap(hook => isObservable(hook.resolver) ? hook.resolver : of(null)),
            timeout(1000),
            toArray(),
            concatMap(() => from(hooks)
                .pipe(
                    filter(hook => hook.priority === ExtensionShutdownPriority.NORMAL),
                    tap(hook => logExt('info', hook.extension.instance, 'shutdown.')),
                    flatMap(hook => isObservable(hook.resolver) ? hook.resolver : of(null)),
                    timeout(1000),
                    toArray()
                )
            ),
            mapTo(null)
        )),
        catchError(err => {
            state.logger().fatal(`shutdown process failed: ${err.message}`);
            process.exit(-1);
            return of(null);
        })
    );
}
