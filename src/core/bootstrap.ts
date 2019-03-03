import { Tracer } from 'opentracing';
import { Type } from './decorators';
import { Extension, ExtensionWithConfig, TokenExt, ExtensionToLoad,ExtensionResult,
    TokenDI, ExtensionConfig, ExtensionLogger, ExtensionType } from './extensions';
import { InternalLogger } from './logger';
import { ModuleManager } from './module';
import { CoreModule, CoreProvide } from './interfaces';
import { Observable, from, throwError, of } from 'rxjs';
import { arr } from './utils';
import { map, tap, flatMap, concatMap } from 'rxjs/operators';
import { ReflectiveInjector } from 'injection-js';
import { DependencyInjection } from './di';
import * as Url from 'url';
import { HookManager } from './hook';
import { ExtentionHooksEnum } from './enums';

class CoreState {
    extensions: ExtensionResult<any>[] = [];
    module: CoreModule;
}

export interface BootstrapOptions {
    tracer?: Tracer;
}

export class Hapiness {

    static bootstrap(module: Type<any>, extensions?: ExtensionToLoad<any>[], options?: BootstrapOptions) {
        return bootstrap(module, extensions, options, new CoreState());
    }
}

const logger = new InternalLogger('bootstrap');

function bootstrap(module: Type<any>, extensions?: ExtensionToLoad<any>[], options?: BootstrapOptions, state: CoreState) {
    extensions = extensions || [];
    options = options || {};
    options.tracer = options.tracer || new Tracer();
    logger.debug(`bootstrapping ${module.name}`);
    if (!module || typeof module !== 'function') {
        return Promise.reject(new Error('You have to provide a module'));
    }
    ModuleManager.resolve(module).pipe(
        tap(cModule => state.module = cModule),
        flatMap(() => loadExtensions(extensions, state))
    )
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
        .filter(ext => !! ext.instance.config.type)
        .map(ext => (<CoreProvide>{ provide: TokenDI(ext.instance.config.type.toString()), useValue: ext.value }));
    return DependencyInjection.createAndResolve(arr(providers)
        .concat([
            { provide: ExtensionConfig, useValue: { ...extension.config, extension_name: extension.token.name } },
            { provide: ExtensionLogger, useClass: ExtensionLogger }
        ])
    );
}

function findLoggingExtension(state: CoreState): ExtensionResult<any> | null {
    return state.extensions.find(e => e.instance.config.type === ExtensionType.LOGGING);
}

function formatConfig(config: ExtensionConfig): string {
    if (config.uri) {
        return Url.parse(config.uri).host;
    } else if (config.host) {
        return config.host + (config.port ? `:${config.port}` : '');
    }
}

function loadExtension<T>(extension: ExtensionWithConfig<T>, di: ReflectiveInjector): Observable<ExtensionResult<T>> {
    return of(<Extension<any>>Reflect.apply((<any>extension.token).instantiate, extension.token, [di])).pipe(
        tap(instance => instance.logger && instance.logger.info(`loading extension '${extension.token.name}'` +
            `${formatConfig(instance.config) ? `, using ${formatConfig(instance.config)}` : ''}`)),
        flatMap(instance => HookManager
            .triggerHook<T, ExtensionResult<T>>(
                ExtentionHooksEnum.OnLoad.toString(),
                extension.token,
                instance,
                [ module ]
            )
        )
    );
}

function loadExtensions(extensions: ExtensionToLoad<any>[], state: CoreState): Observable<any> {
    return from(arr(extensions)).pipe(
        map(ext => convertToExtensionWithConfig(ext)),
        flatMap(ext => 
            !!findLoggingExtension(state) ?
                throwError(new Error(`Logging extension already loaded: ${findLoggingExtension(state).token.name}`)) :
                of(ext)
        ),
        concatMap(ext => buildDIForExtension(ext, state).pipe(
            flatMap(di => )
        ))
    )
}
