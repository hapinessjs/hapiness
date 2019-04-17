import { Type, TypeDecorator, makeDecorator, Inject, InjectionToken, Optional } from 'injection-js';
import * as Ajv from 'ajv';
import { serializer, isTSchema } from '@juneil/tschema';
export { Inject, Optional, InjectionToken, makeDecorator };

export interface Type<T> extends Function {
    new (...args: any[]): T;
}

/**
 * Decorator signature
 */
export interface CoreDecorator<T> {
    (obj?: T): TypeDecorator;
    new (obj?: T): T;
}

export interface CorePropDecorator<T> {
    (obj?: T): any;
}

const AJV = new Ajv({
    removeAdditional: true,
    useDefaults: true,
    coerceTypes: true,
    allErrors: true
});

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
            Object.keys(decoratorInstance).forEach(key => decoratorInstance[key] = compileSchema(decoratorInstance[key]));
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

function compileSchema(value: any) {
    if (!(value instanceof Function && isTSchema(value))) {
        return value;
    }
    value['_compile'] = { ajv: AJV, validate: AJV.compile({ ...serializer(value), additionalProperties: false }) };
    return value;
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
    prefix?: string | boolean;
    declarations?: Array<Type<any>|any>;
    providers?: Array<Type<any>|any>;
    imports?: Array<Type<any>|any>;
    exports?: Array<Type<any>|any>;
}
export const Module = createDecorator<Module>('Module', {
    version: undefined,
    prefix: true,
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

export interface HTTPService {
    baseUrl?: string;
}

export const HTTPService = createDecorator<HTTPService>('HTTPService', {
    baseUrl: undefined
});

export interface Call {
    method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
    path?: string;
    response?: Type<any>;
}

export const Call = createPropDecorator<Call>('Call', {
    method: 'get',
    path: undefined,
    response: undefined
});

export interface Service {
    moduleOnly: boolean;
}
export const Service = createDecorator<Service>('Service', {
    moduleOnly: false
});
