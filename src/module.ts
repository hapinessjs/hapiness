import { buildInternalDI } from './di';
import * as Hoek from 'hoek';
import { ReflectiveInjector } from 'injection-js';
import { extractMetadata, HapinessModule } from './';

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
export interface CoreModule {
    di: ReflectiveInjector;
    name: string;
    version: string;
    options: any;
    providers: CoreProvide[];
}

/**
 * Entrypoint to build a Module
 * Get the metadata and build the
 * module instance with the DI
 *
 * @param  {any} module
 * @returns CoreModule
 */
export function buildModule(module: any): CoreModule {
    const metadata = extractMetadata(module);
    Hoek.assert(metadata && metadata.length === 1, new Error('Please define a Module with the right annotation'));
    const moduleMetadata = <HapinessModule>metadata.pop();
    return moduleFromMetadata(moduleMetadata, module.name);
}

/**
 * Transform metadata to instance Module
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
        di: buildInternalDI(providers)
    };
}
