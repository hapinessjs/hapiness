import { CoreModule } from './core';
import { extractMetadata } from './utils';
import { HapinessModule } from './decorators';
import { ReflectiveInjector } from 'injection-js';
import * as Hoek from 'hoek';

/**
 * Entrypoint to build a CoreModule
 * Get the metadata and build the
 * module instance with the DI
 *
 * @param  {any} module
 * @returns CoreModule
 */
export function buildModule(module: any): CoreModule {
    console.log('dddd', module);
    const metadata = extractMetadata(module);
    Hoek.assert(metadata && metadata.length === 1, new Error('Please define a Module with the right annotation'));
    const moduleMetadata = <HapinessModule>metadata.pop();
    return moduleFromMetadata(moduleMetadata, module.name);
}

/**
 * Transform metadata to instance CoreModule
 *
 * @param  {HapinessModule} data
 * @param  {string} name
 * @returns CoreModule
 */
function moduleFromMetadata(data: HapinessModule, name: string): CoreModule {
    const providers = data.providers || [];
    return {
        name,
        version: data.version,
        options: data.options || {},
        providers: providers.map(p => !!p.provide ? p : {provide: p, useClass: p}),
        di: ReflectiveInjector.resolveAndCreate(providers)
    };
}
