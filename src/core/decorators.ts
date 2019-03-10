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
    new (obj: T): T;
}

export interface CorePropDecorator<T> {
    (obj?: T): any;
}

/**
 * Merge properties
 */
function makeMetadataCtor(props: ([string, any] | { [key: string]: any })[]): any {
    return function ctor(this: any, ...args: any[]) {
        props.forEach((prop, i) => {
            const argVal = args[i];
            if (Array.isArray(prop)) {
                this[prop[0]] = argVal === undefined ? prop[1] : argVal;
            } else {
                for (const propName of Object.keys(prop)) {
                    this[propName] = argVal && argVal.hasOwnProperty(propName) ? argVal[propName] : prop[propName];
                }
            }
        });
    };
}

/**
 * Create a property decorator
 */
function makePropDecorator(name: string, props: ([string, any] | { [key: string]: any })[], parentClass?: any): any {
    const metaCtor = makeMetadataCtor(props);
    function PropDecoratorFactory(this: unknown, ...args: any[]): any {
        if (this instanceof PropDecoratorFactory) {
            metaCtor.apply(this, args);
            return this;
        }
        const decoratorInstance = new (<any>PropDecoratorFactory)(...args);
        return function PropDecorator(target: any, _name: string) {
            const paramtypes = Reflect.getOwnMetadata('design:paramtypes', target, _name) || {};
            decoratorInstance.paramtypes = paramtypes;
            const meta = Reflect.getOwnMetadata('propMetadata', target.constructor) || {};
            meta[_name] = (meta.hasOwnProperty(_name) && meta[_name]) || [];
            meta[_name].unshift(decoratorInstance);
            Reflect.defineMetadata('propMetadata', meta, target.constructor);
        };
    }
    if (parentClass) {
        PropDecoratorFactory.prototype = Object.create(parentClass.prototype);
    }
    PropDecoratorFactory.prototype.toString = () => `@${name}`;
    (<any>PropDecoratorFactory).annotationCls = PropDecoratorFactory;
    return PropDecoratorFactory;
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
 * Create a property decorator with metadata
 *
 * @param  {string} name
 * @param  {{[name:string]:any;}} props?
 * @returns CoreDecorator
 */
export function createPropDecorator<T>(name: string, props?: { [name: string]: any; }): CorePropDecorator<T> {
    return <CorePropDecorator<T>>makePropDecorator(name, [props]);
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
