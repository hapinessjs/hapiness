import { Decorator, HapinessModule, Injectable, Route, Lib } from '../core/decorators';
import * as Boom from 'boom';
import * as Debug from 'debug';
const debug = Debug('util/metadata');

/**
 * Helper to extract Metadata
 * from a decorator
 *
 * @todo Filter with the right type
 * @param  {any} type
 * @returns Decorator
 */
export function extractMetadata(type: any): Decorator {
    return extractMetadatas(type)
        .map(x => getDecoratorType(x.toString().slice(1), x))
        .pop();
};

/**
 * Helper to extract Metadata
 * with the decorator name provided
 *
 * @param  {any} type
 * @param  {string} name
 */
export function extractMetadataByDecorator(type: any, name: string) {
    return extractMetadatas(type)
        .map(x => getDecoratorType(x.toString().slice(1), x))
        .filter(x => x.toString().slice(1) === name)
        .pop();
}

/**
 * Helper to extract Metadata
 * from a decorator
 *
 * @todo Filter with the right type
 * @param  {any} decorator
 * @returns []
 */
export function extractMetadatas(decorator: any): any[] {
    return Reflect.getOwnMetadataKeys(decorator)
        .filter(x => x === 'annotations')
        .map(x => <any[]>Reflect.getOwnMetadata(x, decorator))
        .map(x => [].concat(x))
        .pop() || [];
};

/**
 * Cast the right decorator type
 * to the value provided
 *
 * @param  {string} name
 * @param  {any} value
 * @returns any
 */
function getDecoratorType(name: string, value: any): Decorator {
    debug('Get decorator type', name);
    switch (name) {
        case 'Injectable':
            return <Injectable>value;
        case 'HapinessModule':
            return <HapinessModule>value;
        case 'Route':
            return <Route>value;
        case 'Lib':
            return <Lib>value;
        default:
            throw Boom.create(500, `Decorator ${name} does not exists.`);
    }
}
