import 'reflect-metadata';
import { lightObservable } from '../util/common';
import { ModuleLifecycleHook, eModuleLifecycleHooks } from '../module/hook';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { Observer } from 'rxjs/Observer';
import { ModuleBuilder } from '../module';
import { ReflectiveInjector } from 'injection-js';
import { Type } from 'injection-js/facade/type';
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
    instance: any;
    di: ReflectiveInjector;
    name: string;
    version: string;
    options: any;
    providers?: CoreProvide[];
    modules?: CoreModule[];
}

/**
 * MainModule type
 * Same as CoreModule but
 * with HapiJS server instance
 */
export interface MainModule extends CoreModule {
    server: Server;
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
        this.mainModule = <MainModule>ModuleBuilder.buildModule(module);
        this.mainModule.server = new Server();
        this.mainModule.server.connection(this.mainModule.options);
        return new Promise((resolve, reject) => {
            Observable.forkJoin(
                this.registrationObservables(this.flattenModules()).concat(lightObservable())
            ).subscribe(() => {
                this.mainModule.server.start()
                    .then(() => {
                        ModuleLifecycleHook.triggerHook(eModuleLifecycleHooks.OnStart, module, this.mainModule.instance, []);
                        resolve();
                    })
                    .catch((error) => {
                        ModuleLifecycleHook.triggerHook(eModuleLifecycleHooks.OnError, module, this.mainModule.instance, [error]);
                        reject(error);
                    });
            }, (error) => {
                ModuleLifecycleHook.triggerHook(eModuleLifecycleHooks.OnError, module, this.mainModule.instance, [error]);
                reject(error);
            });
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
        const modules = module.modules || [];
        register.attributes = {
            name: module.name,
            version: module.version,
            dependencies: modules.map(m => m.name)
        };
        return Observable.create((observer) => {
            this.mainModule.server.register(register)
                .then(() => {
                    ModuleLifecycleHook.triggerHook(eModuleLifecycleHooks.OnStart, module, this.mainModule.instance, []);
                    observer.next();
                    observer.complete();
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
            next();
        };
    }

}
