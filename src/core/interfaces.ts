import { Type, Module } from './decorators';
import { ReflectiveInjector } from 'injection-js';
import { Observable } from 'rxjs';
import { ModuleLevel } from './enums';

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
export class CoreModule extends Module {
    token: Type<any> | any;
    name: string;
    instance?: any;
    level: ModuleLevel;
    di?: ReflectiveInjector;
    parent?: CoreModule;
    modules?: CoreModule[];
    all_providers?: CoreProvide[];
}

/**
 * CoreModuleWithProviders Type
 * Used to pass data while module importation
 */
export interface CoreModuleWithProviders {
    module: Type<any>;
    providers: CoreProvide[];
}

/**
 * Module Lifecycle Hook
 * called once the module has been
 * registered into the server
 *
 * @returns void | Observable
 */
export interface OnRegister { onRegister(): void | Observable<any>; }

/**
 * Module Lifecycle Hook
 * called once the server has started
 * only for the MainModule
 *
 * @returns void | Observable
 */
export interface OnStart { onStart(): void | Observable<any>; }

/**
 * Module Lifecycle Hook
 * called when an error
 * occured in components
 *
 * @returns void | Observable
 */
export interface OnError { onError(error: Error, data?: any): void | Observable<any>; }
