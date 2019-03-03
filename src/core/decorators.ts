import { Type, TypeDecorator, makeDecorator, Inject, Injectable, InjectionToken, Optional } from 'injection-js';
export { Injectable, Inject, Optional, InjectionToken, makeDecorator };

export interface Type<T> extends Function {
    new (...args: any[]): T;
}

/**
 * Decorator signature
 */
export interface CoreDecorator<T> {
    (obj: T): TypeDecorator;
    new (obj: T): T
}

/**
 * Create a decorator with metadata
 *
 * @param  {string} name
 * @param  {{[name:string]:any;}} props?
 * @returns CoreDecorator
 */
export function createDecorator<T>(name: string, props?: { [name: string]: any; }): CoreDecorator<T> {
    return <CoreDecorator<T>>makeDecorator(name, props);
}

/**
 * Module decorator and metadata.
 *
 * @Annotation
 */
export interface Module {
    version: string;
    declarations?: Array<Type<any>|any>;
    providers?: Array<Type<any>|any>;
    imports?: Array<Type<any>|any>;
    exports?: Array<Type<any>|any>;
}
export const Module = createDecorator<Module>('Module', {
    version: undefined,
    declarations: undefined,
    providers: undefined,
    imports: undefined,
    exports: undefined
});

/**
 * Lib decorator and metadata.
 *
 * @Annotation
 */
export interface Lib {}
export const Lib = makeDecorator('Lib', null);
