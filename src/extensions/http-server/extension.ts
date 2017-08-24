import { ModuleLevel } from '../../core/enums';
import { DependencyInjection } from '../../core/di';
import { HookManager } from '../../core/hook';
import { extractMetadataByDecorator } from '../../core/metadata';
import { ModuleManager } from '../../core/module';
import { errorHandler } from '../../core/hapiness';
import { CoreModule, OnExtensionLoad, OnModuleInstantiated, ExtensionWithConfig, Extension } from '../../core/interfaces';
import { Lifecycle } from './decorators';
import { Type } from '../../core/decorators';
import { enumByMethod, LifecycleComponentEnum } from './enums';
import { LifecycleManager } from './lifecycle';
import { RouteBuilder } from './route';
import { CoreRoute, HapiConfig } from './interfaces';
import { Observable } from 'rxjs';
import { RouteConfiguration, Server, Request, ReplyNoContinue, ReplyWithContinue } from 'hapi';

export class HttpServerExt implements OnExtensionLoad, OnModuleInstantiated {

    private server: Server;

    public static setConfig(config: HapiConfig): ExtensionWithConfig {
        return {
            token: HttpServerExt,
            config
        };
    }

    /**
     * Initialize HapiJS Server
     *
     * @param  {CoreModule} module
     * @param  {HapiConfig} config
     * @returns Observable
     */
    onExtensionLoad(module: CoreModule, config: HapiConfig): Observable<Extension> {
        return Observable
            .of(new Server(config.options))
            .do(_ => _.connection(Object.assign(config, { options: undefined })))
            .flatMap(server =>
                Observable
                    .of({
                        instance: this,
                        token: HttpServerExt,
                        value: server
                    })
            )
    }

    /**
     * Build Lifecycle components
     * Add routes by modules
     * Add Lifecycle handlers
     * Start HapiJS Server
     *
     * @param  {CoreModule} module
     * @param  {Server} server
     * @returns Observable
     */
    onModuleInstantiated(module: CoreModule, server: Server): Observable<any> {
        return Observable
            .from(ModuleManager.getModules(module))
            .flatMap(_ => this.registerPlugin(_, server))
            .reduce((a, c) => a.concat(c), [])
            .do(_ => LifecycleManager.routeLifecycle(server, _))
            .flatMap(_ => this.instantiateLifecycle(module, server))
            .flatMap(_ => server.start());
    }

    /**
     * Register a HapiJS Plugin
     *
     * @param  {CoreModule} module
     * @param  {Server} server
     * @returns Observable
     */
    private registerPlugin(module: CoreModule, server: Server): Observable<CoreRoute[]> {
        const register: any = (s, o, n) => n();
        register.attributes = {
            name: module.name,
            version: module.version
        };
        return Observable
            .fromPromise(server.register(register))
            .flatMap(_ => this.addRoutes(module, server));
    }

    /**
     * Add routes from CoreModule
     *
     * @param  {CoreModule} module
     * @param  {Server} server
     * @returns Observable
     */
    private addRoutes(module: CoreModule, server: Server): Observable<CoreRoute[]> {
        return Observable
            .from(RouteBuilder.buildRoutes(module))
            .do(_ =>
                server
                    .route(<RouteConfiguration>{
                        method: _.method,
                        path: _.path,
                        config: Object.assign({
                            handler: (request, reply) => this.httpHandler(request, reply, _)
                        }, _.config)
                    })
            )
            .toArray();
    }

    /**
     * Trigger the http handler hook
     * Reply automatically
     *
     * @param  {Request} request
     * @param  {ReplyNoContinue} reply
     * @param  {CoreRoute} route
     * @returns void
     */
    private httpHandler(request: Request, reply: ReplyNoContinue, route: CoreRoute): void {
        HookManager
            .triggerHook(
                enumByMethod(request.method).toString(),
                route.token,
                request['_hapinessRoute'],
                [ request, reply ]
            )
            .map(_ => !!_.statusCode ? _ : { statusCode: 200, response: _ })
            .subscribe(
                _ =>
                    reply(_.response)
                        .code(!!_.response ? _.statusCode : 204),
                _ => {
                    errorHandler(_);
                    reply(_);
                }
            );
    }

     /**
     * Initialize and instantiate lifecycle components
     *
     * @param  {CoreModule} module
     * @param  {Server} server
     */
    private instantiateLifecycle(module: CoreModule, server: Server): Observable<any> {
        return Observable
            .from([].concat(module.declarations))
            .filter(_ => !!_ && !!extractMetadataByDecorator(_, 'Lifecycle'))
            .map(_ => ({ metadata: <Lifecycle>extractMetadataByDecorator(_, 'Lifecycle'), token: _ }))
            .do(_ =>
                server.ext(<any>_.metadata.event, (request: Request, reply: ReplyWithContinue) => {
                    this
                        .eventHandler(_.token, module, request, reply)
                        .subscribe(
                            () => {},
                            err => errorHandler(err)
                        )
                })
            )
            .ignoreElements();
    }

    private eventHandler(lifecycle: Type<any>, module: CoreModule, request: Request, reply: ReplyWithContinue): Observable<any> {
        return Observable
            .of(lifecycle)
            .flatMap(lc =>
                DependencyInjection
                    .instantiateComponent(lc, module.di)
                    .flatMap(_ =>
                        HookManager
                            .triggerHook(LifecycleComponentEnum.OnEvent.toString(), lc, _, [request, reply])
                    )
            );
    }
}
