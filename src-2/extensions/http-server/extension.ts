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

    onExtensionLoad(module: CoreModule, config: HapiConfig): Observable<Extension> {
        return Observable
            .of(new Server(config.options))
            .do(_ => _.connection({ host: config.host, port: config.port }))
            .flatMap(server =>
                Observable
                    .from(ModuleManager.getModules(module))
            )
    }

    /**
     * Register a HapiJS Plugin
     *
     * @param  {CoreModule} module
     * @param  {Server} server
     * @returns Observable
     */
    private registerPlugin(module: CoreModule, server: Server): Observable<CoreRoute[]> {
        return Observable
            .of(_ => (s, o, n) => n())
            .do(_ => _['attributes'] = {
                name: `${module.name}.hapinessplugin`,
                version: module.version
            })
            .flatMap(_ => Observable.fromPromise(server.register(_)))
            .flatMap(_ => this.addRoutes(module, server));
    }

    /**
     * Add route from CoreModule
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
    private instantiateLifecycle(module: CoreModule, server: Server) {
        return Observable
            .from([].concat(module.declarations))
            .filter(_ => !!_ && !!extractMetadataByDecorator(_, 'Lifecycle'))
            .map(_ => <Lifecycle>extractMetadataByDecorator(_, 'Lifecycle'))
            .do(_ =>
                server.ext(<any>_.event, (request, reply) => {

                })
            )


        // ModuleManager.getModules(module).forEach(_module => {
        //     [].concat(_module.declarations).filter(decl => !!extractMetadataByDecorator(decl, 'Lifecycle'))
        //     .map(lc => {
        //         debug('add lifecycle', lc.name, _module.token.name);
        //         const metadata = <Lifecycle>extractMetadataByDecorator(lc, 'Lifecycle');
        //         server.ext(<any>metadata.event, (request, reply) => {
        //             const instance = DependencyInjection.instantiateComponent(lc, _module.di);
        //             HookManager.triggerHook(LifecycleComponentEnum.OnEvent.toString(), lc, instance, [ request, reply ]);
        //         });
        //     });
        // });
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
            )
    }

    /**
     * this.server = new Server();
        const connection = this.server.connection(config);
        debug('server instantiation');
        return Observable.create(observer => {
            Observable.forkJoin(
                this.registrationObservables(module, this.server, this.flattenModules(module)).concat(this.addRoutes(module, this.server))
            ).subscribe(routes => {
                debug('routes and plugins registered');
                LifecycleManager.routeLifecycle(this.server, routes.reduce((a, c) => a.concat(c), []));
                observer.next({
                    instance: this,
                    token: HttpServerExt,
                    value: this.server
                });
                observer.complete();
            }, err => {
                observer.error(err);
                observer.complete();
            });
        });
     */
}
