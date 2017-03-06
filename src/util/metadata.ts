/**
 * Helper to extract Metadata
 * from a decorator
 * @todo Filter with the right type
 * @param  {any} decorator
 * @returns []
 */
export function extractMetadata(decorator: any): Array<any> {
    return Reflect.getOwnMetadataKeys(decorator)
            .filter(x => x === 'annotations')
            .map(x => <Array<any>>Reflect.getOwnMetadata(x, decorator))
            .map(x => [].concat(x))
            .pop();
};
