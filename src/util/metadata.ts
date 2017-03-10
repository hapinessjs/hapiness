import { Decorator, HapinessModule, Injectable } from '../core/decorators';
import * as Boom from 'boom';
import * as Debug from 'debug';
const debug = Debug('util/metadata');

/**
 * Helper to extract Metadata
 * from a decorator
 *
 * @todo Filter with the right type
 * @param  {any} decorator
 * @returns Decorator
 */
export function extractMetadata(decorator: any): Decorator {
    return extractMetadatas(decorator)
        .map(x => getDecoratorType(x.toString().slice(1), x))
        .pop();
};

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
        default:
            throw Boom.create(500, `Decorator ${name} does not exists.`);
    }
}
