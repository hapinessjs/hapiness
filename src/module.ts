import { CoreModule } from './core';
import { extractMetadata } from './utils';
import { HapinessModule } from './decorators';
import { ReflectiveInjector } from 'injection-js';
import * as Hoek from 'hoek';

import * as Debug from 'debug';
const debug = Debug('module');

/**
 * Entrypoint to build a CoreModule
 * Get the metadata and build the
 * module instance with the DI
 *
 * @param  {any} module
 * @returns CoreModule
 */
export function buildModule(module: any): CoreModule {
    debug('Module entrypoint', module.name);
    const moduleResolved = recursiveResolution(module);
    debug('Module resolved', moduleResolved);
    return moduleResolved;
}

/**
 * Transform metadata to instance CoreModule
 *
 * @param  {HapinessModule} data
 * @param  {string} name
 * @param  {CoreModule} parent
 * @returns CoreModule
 */
function coreModuleFromMetadata(data: HapinessModule, name: string, parent?: CoreModule): CoreModule {
    const providers = data.providers || [];
    return {
        name,
        version: data.version,
        options: data.options || {},
        providers: providers.map((p: any) => !!p.provide ? p : {provide: p, useClass: p}),
        di: parent ? parent.di.resolveAndCreateChild(providers) : ReflectiveInjector.resolveAndCreate(providers)
    };
}

/**
 * Extract metadata from
 * the module provided
 * 
 * @param  {any} module
 * @returns HapinessModule
 */
function metadataFromModule(module: any): HapinessModule {
    const metadata = extractMetadata(module);
    Hoek.assert(metadata && metadata.length === 1, new Error('Please define a Module with the right annotation'));
    return <HapinessModule>metadata.pop();
}

/**
 * Resolve recursively 
 * each module imported
 * 
 * @todo Fix circular importation !!!
 * @param  {any} module
 * @returns CoreModule
 */
function recursiveResolution(module: any, parent?: CoreModule): CoreModule {
    debug('Recursive resolution', module.name);
    const metadata = metadataFromModule(module);
    const coreModule = coreModuleFromMetadata(metadata, module.name, parent);
    if (!(metadata.imports && metadata.imports.length > 0)) {
        debug('Module resolved', coreModule);
        return coreModule;
    }
    coreModule.modules = metadata.imports.map(x => recursiveResolution(x, coreModule));
    return coreModule;
}
