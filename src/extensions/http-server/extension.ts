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
import { ConnectionOptions, CoreRoute, HapiConfig, HTTPHandlerResponse } from './interfaces';
import { Observable } from 'rxjs';
import { RouteConfiguration, Server, Request, ReplyNoContinue, ReplyWithContinue } from 'hapi';

export class HttpServerExt implements OnExtensionLoad, OnModuleInstantiated {

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
            .flatMap(server => Observable
                .of(Object.assign({}, config, { options: undefined }))
                .map(_ => this.formatConnections(_))
                .do(_ => _.forEach(connection => server.connection(connection)))
                .map(_ => server)
            )
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
            .flatMap(_ => this.instantiateLifecycle(_, server))
            .flatMap(_ => this.registerPlugin(_, server))
            .reduce((a, c) => a.concat(c), [])
            .do(_ => LifecycleManager.routeLifecycle(server, _))
            .flatMap(_ => server.start());
    }

    /**
     * Format the config provided
     * to a list of ConnectionOptions
     *
     * @param  {HapiConfig} config
     * @returns ConnectionOptions
     */
    private formatConnections(config: HapiConfig): ConnectionOptions[] {
        return []
            .concat(!!(<any>config).connections ?
                (<any>config).connections :
                config
            )
            .filter(_ => !!_)
            .map(_ => <ConnectionOptions>_);
    }

    /**
     * Register a HapiJS Plugin
     *
     * @param  {CoreModule} module
     * @param  {Server} server
     * @returns Observable
     */
    private registerPlugin(module: CoreModule, server: Server): Observable<CoreRoute[]> {
        return this
            .buildRoutes(module)
            .flatMap(routes => Observable
                .of(<any>this.registerHandler(routes))
                .do(_ => _.attributes = { name: module.name, version: module.version })
                .flatMap(_ => Observable
                    .fromPromise(server.register(_))
                    .map(__ => routes)
                )
            );
    }

    /**
     * Add routes from CoreModule
     *
     * @param  {CoreRoute[]} module
     * @returns Observable
     */
    private registerHandler(routes: CoreRoute[] = []): (s, o, n) => void {
        return (server: Server, options, next) => {
            routes
                .forEach(_ => {
                    const _server = !!_.labels ? server.select(_.labels) : server;
                    _server.route(<RouteConfiguration>{
                        method: _.method,
                        path: _.path,
                        config: Object.assign({
                            handler: (request, reply) => this.httpHandler(request, reply, _)
                        }, _.config)
                    });
                });
            next();
        }
    }

    /**
     * Build CoreRoute based on a module
     *
     * @param  {CoreModule} module
     * @returns Observable
     */
    private buildRoutes(module: CoreModule): Observable<CoreRoute[]> {
        return Observable
            .from(RouteBuilder.buildRoutes(module))
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
            .map(_ => this.formatResponse(_))
            .subscribe(
                _ => {
                    const repl = reply(_.response)
                        .code(this.isValid(_.response) ? _.statusCode : 204);
                    repl.headers = Object.assign(_.headers, repl.headers);
                },
                _ => {
                    errorHandler(_, request);
                    reply(_);
                }
            );
    }

    /**
     * Format response to HTTPHandlerResponse object
     *
     * @param  {any} data
     * @returns HTTPHandlerResponse
     */
    private formatResponse(data: any): HTTPHandlerResponse {
        return {
            statusCode: !!data ? data.statusCode || 200 : 200,
            headers: !!data ? data.headers || {} : {},
            response: !!data ? data.response || data : data
        };
    }

    /**
     * Check of response is not empty
     *
     * @param  {any} response
     * @returns boolean
     */
    private isValid(response: any): boolean {
        return typeof(response) !== 'undefined' && response !== null;
    }

     /**
     * Initialize and instantiate lifecycle components
     *
     * @param  {CoreModule} module
     * @param  {Server} server
     */
    private instantiateLifecycle(module: CoreModule, server: Server): Observable<CoreModule> {
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
            .toArray()
            .map(_ => module);
    }

    /**
     * Lifecycle Event Handler
     * Instantiate the Lifecycle component
     * And trigger the hook
     *
     * @param  {Type<any>} lifecycle
     * @param  {CoreModule} module
     * @param  {Request} request
     * @param  {ReplyWithContinue} reply
     * @returns Observable
     */
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
