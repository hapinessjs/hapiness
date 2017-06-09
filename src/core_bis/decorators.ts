import { RouteConfig } from '../route';
import { TypeDecorator, makeDecorator } from '../externals/injection-js/util/decorators';
import { Type } from '../externals/injection-js/facade/type';
import { Inject, Injectable, InjectionToken, Optional } from '../externals/injection-js';

export { Injectable, Inject, Optional, InjectionToken };

/**
 * Type of the HapinessModule decorator / constructor function.
 */
export interface HapinessModuleDecorator {
  (obj: HapinessModule): TypeDecorator;
  new (obj: HapinessModule): HapinessModule;
}

/**
 * Type of the HapinessModule metadata.
 */
export interface HapinessModule {
    version: string;
    options?: Object;
    declarations?: Array<Type<any>|any>;
    providers?: Array<Type<any>|any>;
    imports?: Array<Type<any>|any>;
    exports?: Array<Type<any>|any>;
}

/**
 * HapinessModule decorator and metadata.
 *
 * @Annotation
 */
export const HapinessModule: HapinessModuleDecorator = <HapinessModuleDecorator>makeDecorator('HapinessModule', {
    version: undefined,
    options: undefined,
    declarations: undefined,
    providers: undefined,
    imports: undefined,
    exports: undefined
});

/**
 * Type of the Route decorator / constructor function.
 */
export interface RouteDecorator {
  (obj: Route): TypeDecorator;
  new (obj: Route): Route;
}

/**
 * Type of the Route metadata.
 */
export interface Route {
    path: string;
    method: string | string[];
    config?: RouteConfig;
    providers?: Array<Type<any>|any>;
}

/**
 * Route decorator and metadata.
 *
 * @Annotation
 */
export const Route: RouteDecorator = <RouteDecorator>makeDecorator('Route', {
    path: undefined,
    method: undefined,
    config: undefined,
    providers: undefined
});

/**
 * Type of the Lib metadata.
 */
export interface Lib {}

/**
 * Lib decorator and metadata.
 *
 * @Annotation
 */
export const Lib = makeDecorator('Lib', null);

/**
 * Type of the Lifecycle decorator / constructor function.
 */
export interface LifecycleDecorator {
  (obj: Lifecycle): TypeDecorator;
  new (obj: Lifecycle): Lifecycle;
}

/**
 * Type of the Lifecycle metadata.
 */
export interface Lifecycle {
    event: string;
}

/**
 * Lifecycle decorator and metadata.
 *
 * @Annotation
 */
export const Lifecycle: LifecycleDecorator = <LifecycleDecorator>makeDecorator('Lifecycle', {
    event: undefined
});

/**
 * Type of the Extention decorator / constructor function.
 */
export interface ExtentionDecorator {
  (obj: Extention): TypeDecorator;
  new (obj: Extention): Extention;
}

/**
 * Type of the Extention metadata.
 */
export interface Extention {
    event: string;
}

/**
 * Extention decorator and metadata.
 *
 * @Annotation
 */
export const Extention: ExtentionDecorator = <ExtentionDecorator>makeDecorator('Extention', {
    event: undefined
});

export type Decorator = Injectable | HapinessModule | Route | Lib | Lifecycle;
