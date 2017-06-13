import { ExtentionWithConfig } from '../../core';
import { RouteBuilder, CoreRoute } from './route';
import { RouteMethodsEnum, enumByMethod } from './enums';
import { HookManager } from '../../core/hook';
import { CoreModule, ModuleManager, ModuleLevel } from '../../core/module';
import { OnExtentionLoad, Extention } from '../../core/bootstrap';
import { LifecycleManager } from './lifecycle';
import { Observable } from 'rxjs/Observable';
import { Server, RouteConfiguration } from 'hapi';
import * as Hoek from 'hoek';
import * as Boom from 'boom';
import * as Debug from 'debug';
const debug = Debug('hapiness:extention:httpserver');

export interface HapiConfig {
    host: string;
    port: number;
}

export class HttpServer implements OnExtentionLoad {

    public static setConfig(config: HapiConfig): ExtentionWithConfig {
        return {
            token: HttpServer,
            config
        };
    }

    onExtentionLoad(module: CoreModule, config: HapiConfig): Observable<Extention> {
        const server = new Server();
        const connection = server.connection(config);
        debug('server instantiation', server.info.host);
        return Observable.create(observer => {
            Observable.forkJoin(
                this.registrationObservables(module, server, this.flattenModules(module)).concat(this.addRoutes(module, server))
            ).subscribe(routes => {
                debug('routes and plugins registered');
                LifecycleManager.routeLifecycle(server, routes.reduce((a, c) => a.concat(c), []));
                server.start()
                    .then(() => {
                        debug('http server started');
                        observer.next({
                            instance: server
                        });
                        observer.complete();
                    })
                    .catch(err => {
                        observer.error(err);
                        observer.complete();
                    });
            }, err => {
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
}
