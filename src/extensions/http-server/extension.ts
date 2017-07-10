import { Hapiness, ExtensionWithConfig } from '../../core';
import { Extension, OnExtensionLoad, OnModuleInstantiated } from '../../core/bootstrap';
import { DependencyInjection } from '../../core/di';
import { HookManager } from '../../core/hook';
import { extractMetadataByDecorator } from '../../core/metadata';
import { CoreModule, ModuleLevel, ModuleManager } from '../../core/module';
import { Lifecycle } from './decorators';
import { enumByMethod, LifecycleComponentEnum, RouteMethodsEnum } from './enums';
import { LifecycleManager } from './lifecycle';
import { CoreRoute, RouteBuilder } from './route';
import { Observable } from 'rxjs/Observable';
import { RouteConfiguration, Server } from 'hapi';
import * as Boom from 'boom';
import * as Hoek from 'hoek';
import * as Debug from 'debug';
const debug = Debug('hapiness:extension:httpserver');

export interface HapiConfig {
    host: string;
    port: number;
}

export class HttpServerExt implements OnExtensionLoad, OnModuleInstantiated {

    private server: Server;

    public static setConfig(config: HapiConfig): ExtensionWithConfig {
        return {
            token: HttpServerExt,
            config
        };
    }

    onExtensionLoad(module: CoreModule, config: HapiConfig): Observable<Extension> {
        this.server = new Server();
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
    }

    onModuleInstantiated(module: CoreModule) {
        return Observable.create(observer => {
            this.instantiateLifecycle(this.server, module);
            this.server.start()
                .then(() => {
                    debug('http server started', this.server.info.uri);
                    observer.next();
                    observer.complete();
                })
                .catch(err => {
                    observer.error(err);
                    observer.complete();
                });
        });
    }

    /**
     * Lookup into the tree of imports
     * and flat the tree into a string array of names
     *
     * @returns string[]
     */
    private flattenModules(module: CoreModule): string[] {
        const recursive = (_module: CoreModule) => {
            if (_module.modules && _module.modules.length > 0) {
                return _module.modules.reduce((acc, cur) => acc.concat(recursive(cur)), [].concat(_module.modules));
            }
            return [];
        };
        debug('flatten modules');
        return recursive(module).map(a => a.name).filter((a, p, arr) => arr.indexOf(a) === p);
    }

    /**
     * Register each module imported
     * as HapiJS plugin
     *
     * @param  {string[]} names
     * @returns Observable
     */
    private registrationObservables(module: CoreModule, server: Server, names: string[]): Observable<CoreRoute[]>[] {
        return names
            .map(n => ModuleManager.findNestedModule(n, module))
            .filter(m => !!m)
            .map(m => this.registerPlugin(m, server));
    }

    /**
     * Register a HapiJS Plugin
     *
     * @param  {CoreModule} module
     * @returns Observable
     */
    private registerPlugin(module: CoreModule, server: Server): Observable<CoreRoute[]> {
        Hoek.assert(!!module, 'Module argument is missing');
        const pluginName = `${module.name}.hapinessplugin`;
        debug('registering plugin', pluginName);
        return Observable.create((observer) => {
            const register: any = (_server, options, next) => {
                return next();
            };
            register.attributes = {
                name: pluginName,
                version: module.version
            };
            server.register(register)
                .then(() => {
                    this.addRoutes(module, server)
                        .subscribe(routes => {
                            debug('plugin registered', pluginName);
                            observer.next(routes);
                            observer.complete();
                        });
                })
                .catch((error) => {
                    observer.error(error);
                });
        });
    }

    /**
     * Add route from CoreModule
     *
     * @param  {CoreModule} module
     * @param  {Server} server
     * @returns Observable
     */
    private addRoutes(module: CoreModule, server: Server): Observable<CoreRoute[]> {
        Hoek.assert((!!module && !!server), Boom.create(500, 'Please provide module and HapiJS server instance'));
        return Observable.create(observer => {
            const routes = RouteBuilder.buildRoutes(module) || [];
            debug('add routes', module.name, routes.length);
            routes.forEach(route => {
                const config = Object.assign({
                    handler: (req, reply) => {
                        debug('route handler', req.method, req.path);
                        HookManager.triggerHook(
                            enumByMethod(req.method).toString(),
                            route.token,
                            req['_hapinessRoute'],
                            [ req, reply ]
                        );
                    }
                }, route.config);
                server.route(<RouteConfiguration>{
                    method: route.method,
                    path: route.path,
                    config
                });
            });
            observer.next(routes);
            observer.complete();
        });
    }

    /**
     * Initialize and instantiate lifecycle components
     *
     * @param  {Server} server
     * @param  {CoreModule} module
     */
    private instantiateLifecycle(server: Server, module: CoreModule) {
        ModuleManager.getModules(module).forEach(_module => {
            [].concat(_module.declarations).filter(decl => !!extractMetadataByDecorator(decl, 'Lifecycle'))
            .map(lc => {
                debug('add lifecycle', lc.name, _module.token.name);
                const metadata = <Lifecycle>extractMetadataByDecorator(lc, 'Lifecycle');
                server.ext(<any>metadata.event, (request, reply) => {
                    const instance = DependencyInjection.instantiateComponent(lc, _module.di);
                    HookManager.triggerHook(LifecycleComponentEnum.OnEvent.toString(), lc, instance, [ request, reply ]);
                });
            });
        });
    }
}
