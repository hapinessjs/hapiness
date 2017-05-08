import 'reflect-metadata';
import 'rxjs/add/observable/forkJoin';
import { RouteConfig, RouteLifecycleHook } from '../route';
import { RouteBuilder } from '../route';
import { Observable } from 'rxjs/Observable';
import { ModuleBuilder, ModuleLevel, ModuleLifecycleHook, eModuleLifecycleHooks } from '../module';
import { HttpServer, WSServer } from './providers';
import { ServerSocket } from './socket';
import { ReflectiveInjector } from '../externals/injection-js';
import { Type } from '../externals/injection-js/facade/type';
import { Server } from 'hapi';
import * as Hoek from 'hoek';
import * as Boom from 'boom';

/**
 * CoreProvide Type
 * Used by CoreModule Type
 */
export interface CoreProvide {
    provide: any;
    useClass?: any;
    useValue?: any;
    useExisting?: any;
    useFactory?: any;
    deps?: any[];
}

/**
 * CoreModule Type
 * Represents a Module
 */
export interface CoreModule {
    token: Type<any> | any;
    name: string;
    version: string;
    options: any;
    instance?: any;
    level: ModuleLevel;
    di?: ReflectiveInjector;
    providers?: CoreProvide[];
    modules?: CoreModule[];
    parent?: CoreModule;
    exports?: Type<any>[] | any[];
    declarations?: Type<any>[] | any[];
    routes?: CoreRoute[];
    libs?: Type<any>[];
}

/**
 * CoreRoute Type
 * Represents an Http Route
 */
export interface CoreRoute {
    token: Type<any> | any;
    path: string;
    method: string | string[];
    module: CoreModule;
    providers?: CoreProvide[];
    config?: RouteConfig;
}

/**
 * MainModule type
 * Same as CoreModule but
 * with HapiJS server instance
 */
export interface MainModule extends CoreModule {
    server: Server;
    socket: ServerSocket;
    coreProviders: CoreProvide[];
}

/**
 * Hapiness
 */
export class Hapiness {

    /**
     * Root module that contains
     * all the instanciation tree
     *
     * @property {MainModule} mainModule
     */
    private static mainModule: MainModule;

    /**
     * Bootstrapping method
     * Called to initialize and
     * start HapiJS Server
     *
     * @param  {Type<any>} module
     * @returns Promise
     */
    public static bootstrap(module: Type<any>): Promise<{}> {
        const mainOptions = <any>ModuleBuilder.metadataFromModule(module).options;
        const server = new Server();
        let providers = [].concat(this.provideServer(server));
        let socket;
        if (!!mainOptions && mainOptions.socketPort) {
            socket = new ServerSocket(mainOptions.socketPort);
            delete mainOptions.socketPort;
            providers = providers.concat(this.provideWSServer(socket));
        }
        this.mainModule = <MainModule>ModuleBuilder.buildModule(module, providers);
        this.mainModule.server = server;
        this.mainModule.socket = socket;
        this.mainModule.server.connection(mainOptions);
        return new Promise((resolve, reject) => {
            Observable.forkJoin(
                this.registrationObservables(this.flattenModules()).concat(this.addRoutes(this.mainModule, this.mainModule.server))
            ).subscribe(() => {
                this.mainModule.server.start()
                    .then(() => {
                        ModuleLifecycleHook.triggerHook(eModuleLifecycleHooks.OnStart, this.mainModule, []);
                        resolve();
                    })
                    .catch((error) => {
                        ModuleLifecycleHook.triggerHook(eModuleLifecycleHooks.OnError, this.mainModule, [error]);
                        reject(error);
                    });
            }, (error) => {
                ModuleLifecycleHook.triggerHook(eModuleLifecycleHooks.OnError, this.mainModule, [error]);
                reject(error);
            });
        });
    }

    /**
     * Kill the server
     *
     * @returns Observable
     */
    public static kill(): Observable<void> {
        return Observable.create(observer => {
            if (this.mainModule && this.mainModule.server) {
                this.mainModule.server.stop({ timeout: 0 }, () => {
                    // this.mainModule = null;
                    observer.next();
                    observer.complete();
                });
            } else {
                observer.next();
                observer.complete();
            }
        });
    }

    /**
     * Lookup into the tree of imports
     * and flat the tree into a string array of names
     *
     * @returns string[]
     */
    private static flattenModules(): string[] {
        const recursive = (_module: CoreModule) => {
            if (_module.modules && _module.modules.length > 0) {
                return _module.modules.reduce((acc, cur) => acc.concat(recursive(cur)), [].concat(_module.modules));
            }
            return [];
        };
        return recursive(this.mainModule).map(a => a.name).filter((a, p, arr) => arr.indexOf(a) === p);
    }

    /**
     * Register each module imported
     * as HapiJS plugin
     *
     * @param  {string[]} names
     * @returns Observable
     */
    private static registrationObservables(names: string[]): Observable<void>[] {
        return names
            .map(n => ModuleBuilder.findNestedModule(n, this.mainModule))
            .filter(m => !!m)
            .map(m => this.registerPlugin(m));
    }

    /**
     * Register a HapiJS Plugin
     *
     * @param  {CoreModule} module
     * @returns Observable
     */
    private static registerPlugin(module: CoreModule): Observable<void> {
        if (!module) {
            return Observable.throw(Boom.create(500, 'Module argument is missing'));
        }
        Hoek.assert(!!(this.mainModule && this.mainModule.server),
            Boom.create(500, 'You cannot register a plugin before bootstrapping Hapiness'));
        const register: any = this.handleRegistration(module);
        const modules = module.modules;
        register.attributes = {
            name: module.name,
            version: module.version,
            dependencies: modules.map(m => m.name)
        };
        return Observable.create((observer) => {
            this.mainModule.server.register(register)
                .then(() => {
                    ModuleLifecycleHook.triggerHook(eModuleLifecycleHooks.OnRegister, module, []);
                    this.addRoutes(module, this.mainModule.server)
                        .subscribe(() => {
                            observer.next();
                            observer.complete();
                        });
                })
                .catch((error) => {
                    observer.error(error);
                });
        });
    }

    /**
     * HapiJS Plugin handler
     *
     * @param  {CoreModule} module
     */
    private static handleRegistration(module: CoreModule) {
        return (server, options, next) => {
            if (module.level !== ModuleLevel.ROOT) {
                module.modules.forEach(m => {
                    server.dependency(m.name, (_server, _next) => {
                        ModuleLifecycleHook.triggerHook(eModuleLifecycleHooks.OnModuleResolved, module, [m.name])
                            .subscribe(() => _next(), err => _next(err));
                    });
                });
                if (module.level === ModuleLevel.PRIMARY) {
                    ModuleLifecycleHook.triggerHook(eModuleLifecycleHooks.OnModuleResolved, module.parent, [module.name])
                        .subscribe(() => next(), err => next(err));
                } else {
                    next();
                }
            } else {
                next(Boom.create(500, 'You cannot register Root Module as Plugin'));
            }
        };
    }

    /**
     * Add route from CoreModule
     *
     * @param  {CoreModule} module
     * @param  {} server
     * @returns Observable
     */
    private static addRoutes(module: CoreModule, server: Server): Observable<void> {
        Hoek.assert((module && !!server), Boom.create(500, 'Please provide module and HapiJS server instance'));
        return Observable.create(observer => {
            module.routes.forEach(route => {
                const config = Object.assign({
                    handler: (req, reply) => {
                        RouteLifecycleHook.triggerHook(
                            RouteLifecycleHook.enumByMethod(req.method),
                            route.token,
                            RouteBuilder.instantiateRouteAndDI(route),
                            [ req, reply ]
                        );
                    }
                }, route.config);
                server.route({
                    method: route.method,
                    path: route.path,
                    config
                });
            });
            observer.next();
            observer.complete();
        });
    }

    /**
     * Factory for the core server provider
     *
     * @param {Server} server
     * @returns CoreProvide
     */
    private static provideServer(server: Server): CoreProvide {
        return {
            provide: HttpServer,
            useFactory: () => {
                return new HttpServer(server);
            },
            deps: []
        };
    }

    /**
     * Factory for the core ws server provider
     *
     * @param {Server} server
     * @returns CoreProvide
     */
    private static provideWSServer(server: ServerSocket): CoreProvide {
        return {
            provide: WSServer,
            useFactory: () => {
                return new WSServer(server);
            },
            deps: []
        };
    }

}
