import { Tracer } from 'opentracing';
import { Type } from './decorators';
import { Extension, ExtensionWithConfig, TokenExt, ExtensionToLoad, ExtensionResult,
    TokenDI, ExtensionConfig, ExtensionLogger, ExtensionType } from './extensions';
import { ModuleManager } from './module';
import { CoreModule, CoreProvide } from './interfaces';
import { Observable, from, throwError, of } from 'rxjs';
import { arr } from './utils';
import { map, tap, flatMap, concatMap, toArray, filter, mapTo, ignoreElements, retryWhen, take, delay } from 'rxjs/operators';
import { ReflectiveInjector } from 'injection-js';
import { DependencyInjection } from './di';
import * as Url from 'url';
import { HookManager } from './hook';
import { ExtentionHooksEnum, ModuleLevel, ModuleEnum } from './enums';
import { extractMetadataAndName } from './metadata';
import { InternalLogger } from './logger';

class CoreState {
    extensions: ExtensionResult<any>[] = [];
    module: CoreModule;
    internal_logger = new InternalLogger('bootstrap');
    logger(): ExtensionLogger {
        const logger = this.extensions.find(ext => ext.token['type'] === ExtensionType.LOGGING);
        return logger ? logger.value : this.internal_logger;
    }
}

export interface BootstrapOptions {
    tracer?: Tracer;
}

export class Hapiness {

    static bootstrap(module: Type<any>, extensions?: ExtensionToLoad<any>[], options?: BootstrapOptions) {
        return bootstrap(new CoreState(), module, extensions, options);
    }
}

function bootstrap(state: CoreState, module: Type<any>, extensions?: ExtensionToLoad<any>[], options?: BootstrapOptions) {
    if (!module || typeof module !== 'function') {
        return Promise.reject(new Error('You have to provide a module'));
    }
    extensions = extensions || [];
    options = options || {};
    options.tracer = options.tracer || new Tracer();
    return new Promise((resolve, reject) => {
        ModuleManager.resolve(module).pipe(
            tap(coreModule => state.module = coreModule),
            flatMap(() => loadExtensions(extensions, state)),
            tap(() => state.logger().info('--- extensions loaded.')),
            flatMap(extensionResults => instantiateModule(extensionResults, state)),
            tap(() => state.logger().info('--- modules instantiated and registered.')),
            flatMap(() => buildExtensions(state)),
            tap(() => state.logger().info('--- extensions built. starting...')),
            flatMap(() => callStart(state)),
            tap(() => state.logger().info('--- hapiness is running')),
            ignoreElements()
        )
        .subscribe(
            null,
            err => reject(err),
            () => resolve()
        )
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

function loadExtension<T>(extension: ExtensionWithConfig<T>, di: ReflectiveInjector): Observable<ExtensionResult<T>> {
    return of(<Extension<T>>Reflect.apply((<any>extension.token).instantiate, extension.token, [di])).pipe(
        tap(instance => instance.logger && instance.logger.info(`loading extension ${extension.token.name}` +
            `${formatConfig(instance.config) ? `, using ${formatConfig(instance.config)}` : ''}`)),
        flatMap(instance => HookManager
            .triggerHook<Extension<T>, ExtensionResult<T>>(
                ExtentionHooksEnum.OnLoad.toString(),
                extension.token,
                instance,
                [ module ]
            ).pipe(
                retryWhen(errors => errors.pipe(
                    tap(error => instance.logger && instance.logger.error(error.message)),
                    delay(1000),
                    take(2),
                    // concat(e => throwError(e))
                ))
            )
        )
    );
}

function loadExtensions(extensions: ExtensionToLoad<any>[], state: CoreState): Observable<ExtensionResult<any>[]> {
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
            flatMap(di => loadExtension(ext, di)),
            tap(extRes => state.extensions.push(extRes))
        )),
        toArray()
    )
}

function callStart(state: CoreState): Observable<void> {
    return of(state.module).pipe(
        flatMap(coreModule => HookManager
            .triggerHook(
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
        flatMap(coreModule => callRegister(coreModule))
    )
}

function buildExtension<T>(extension: ExtensionResult<T>, state: CoreState): Observable<void> {
    const decorators = extension.instance.decorators || [];
    const metadata = ModuleManager.getModules(state.module)
        .map(module => module.declarations)
        .reduce((a, c) => a.concat(c), <any>[])
        .map(components => extractMetadataAndName(components))
        .filter(data => decorators.indexOf(data.name) > -1);
    extension.instance.logger.info(`building extension ${extension.token.name}.`);
    return HookManager
        .triggerHook(
            ExtentionHooksEnum.OnBuild.toString(),
            extension.token,
            <any>extension.instance,
            [ module, metadata ]
        );
}

function buildExtensions(state: CoreState): Observable<void> {
    return from(state.extensions).pipe(
        flatMap(ext => buildExtension(ext, state)),
        toArray(),
        mapTo(undefined)
    )
}
