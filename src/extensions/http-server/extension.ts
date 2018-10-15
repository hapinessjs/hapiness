import { ReplyNoContinue, ReplyWithContinue, Request, RouteConfiguration, Server } from 'hapi';
import { from, Observable, of } from 'rxjs';
import { defaultIfEmpty, filter, flatMap, map, reduce, tap, toArray } from 'rxjs/operators';
import {
    DependencyInjection,
    errorHandler,
    ExtensionShutdownPriority,
    extractMetadataByDecorator,
    HookManager,
    ModuleManager,
    Type
} from '../../core';
import {
    CoreModule,
    Extension,
    ExtensionShutdown,
    ExtensionWithConfig,
    OnExtensionLoad,
    OnModuleInstantiated,
    OnShutdown
} from '../../core/interfaces';
import { Lifecycle } from './decorators';
import { enumByMethod, LifecycleComponentEnum } from './enums';
import { ConnectionOptions, CoreRoute, HapiConfig, HTTPHandlerResponse } from './interfaces';
import { LifecycleManager } from './lifecycle';
import { RouteBuilder } from './route';

export class HttpServerExt implements OnExtensionLoad, OnModuleInstantiated, OnShutdown {

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
        return of(new Server(config.options))
            .pipe(
                flatMap(server =>
                    of(Object.assign({}, config, { options: undefined }))
                        .pipe(
                            map(_ => this.formatConnections(_)),
                            tap(_ => _.forEach(connection => server.connection(connection))),
                            map(_ => server)
                        )
                ),
                flatMap(server =>
                    of({
                        instance: this,
                        token: HttpServerExt,
                        value: server
                    })
                )
            );
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
        return from(ModuleManager.getModules(module))
            .pipe(
                flatMap(_ => this.instantiateLifecycle(_, server)),
                flatMap(_ => this.registerPlugin(_, server)),
                reduce((a, c) => a.concat(c), []),
                tap(_ => LifecycleManager.routeLifecycle(server, _)),
                flatMap(_ => server.start())
            );
    }

    /**
     * Shutdown HapiJS server extension
     *
     * @param  {CoreModule} module
     * @param  {Server} server
     * @returns ExtensionShutdown
     */
    onShutdown(module: CoreModule, server: Server): ExtensionShutdown {
        return {
            priority: ExtensionShutdownPriority.IMPORTANT,
            resolver: from(server.stop())
        }
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
            .pipe(
                filter(_ => !!_ && _.length > 0),
                flatMap(routes =>
                    of(<any>this.registerHandler(routes))
                        .pipe(
                            tap(_ => _.attributes = { name: module.name, version: module.version }),
                            flatMap(_ =>
                                from(server.register(_))
                                    .pipe(
                                        map(__ => routes)
                                    )
                            )
                        )
                ),
                defaultIfEmpty([])
            );
    }

    /**
     * Add routes from CoreModule
     *
     * @param  {CoreRoute[]} routes
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
        return from(RouteBuilder.buildRoutes(module))
            .pipe(
                toArray()
            );
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
                request[ '_hapinessRoute' ],
                [ request, reply ]
            )
            .pipe(
                map(_ => this.formatResponse(_))
            )
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
        return from([].concat(module.declarations))
            .pipe(
                filter(_ => !!_ && !!extractMetadataByDecorator(_, 'Lifecycle')),
                map(_ => ({ metadata: <Lifecycle>extractMetadataByDecorator(_, 'Lifecycle'), token: _ })),
                tap(_ =>
                    server.ext(<any>_.metadata.event, (request: Request, reply: ReplyWithContinue) => {
                        this
                            .eventHandler(_.token, module, request, reply)
                            .subscribe(
                                () => {
                                },
                                err => errorHandler(err)
                            )
                    })
                ),
                toArray(),
                map(_ => module)
            );
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
        return of(lifecycle)
            .pipe(
                flatMap(lc =>
                    DependencyInjection
                        .instantiateComponent(lc, module.di)
                        .pipe(
                            flatMap(_ =>
                                HookManager
                                    .triggerHook(LifecycleComponentEnum.OnEvent.toString(), lc, _, [ request, reply ])
                            )
                        )
                )
            );
    }
}
