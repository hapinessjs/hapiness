import { HapinessModule, CoreModule, DependencyInjection } from '../core';
import { extractMetadata } from '../util';
import { ReflectiveInjector } from 'injection-js';
import { Type } from 'injection-js/facade/type';
import * as Hoek from 'hoek';

import * as Debug from 'debug';
const debug = Debug('module');


export class ModuleBuilder {

    /**
     * Entrypoint to build a CoreModule
     * Get the metadata and build the
     * module instance with the DI
     *
     * @param  {Type<any>} module
     * @returns CoreModule
     */
     public static buildModule(module: Type<any>): CoreModule {
        debug('Module entrypoint', module.name);
        const moduleResolved = this.recursiveResolution(module);
        debug('Module resolved', moduleResolved);
        return moduleResolved;
    }

    /**
     * Lookup for module in the
     * importation tree by its name
     *
     * @param name
     * @param module
     * @returns CoreModule | null
     */
    public static findNestedModule(name: string, module: CoreModule): CoreModule {
        debug(`Looking for nested module ${name} in ${module.name}`);
        if (module.modules && module.modules.length > 0 &&
            module.modules.find(m => m.name === name)) {
                debug(`Found nested module ${name} in ${module.name}`);
                return module.modules.find(m => m.name === name);
        } else if (module.modules && module.modules.length > 0) {
            debug(`Looking in sub-modules`);
            return module.modules
                .map(m => this.findNestedModule(name, m))
                .filter(m => !!m)
                .shift();
        }
        debug(`Didn't find module ${name}`);
    }

    /**
    * Transform metadata to instance CoreModule
    *
    * @param  {HapinessModule} data
    * @param  {Type<any>} module
    * @param  {CoreModule} parent
    * @returns CoreModule
    */
    private static coreModuleFromMetadata(data: HapinessModule, module: Type<any>, parent?: CoreModule): CoreModule {
        const providers = data.providers || [];
        const di = DependencyInjection.createAndResolve(providers, parent ? parent.di : null);
        return {
            di,
            token: module,
            name: module.name,
            version: data.version,
            options: data.options || {},
            providers: providers.map((p: any) => !!p.provide ? p : {provide: p, useClass: p}),
            instance: DependencyInjection.instantiateComponent(module, di)
        };
    }

    /**
     * Extract metadata from
     * the module provided
     *
     * @todo Metadata interface matching...
     * @param  {Type<any>} module
     * @returns HapinessModule
     */
    private static metadataFromModule(module: Type<any>): HapinessModule {
        const metadata = extractMetadata(module);
        Hoek.assert(metadata && metadata.length === 1, new Error('Please define a Module with the right annotation'));
        return <HapinessModule>metadata.pop();
    }

    /**
     * Resolve recursively
     * each module imported
     *
     * @todo Fix circular importation !!!
     * @param  {Type<any>} module
     * @returns CoreModule
     */
    private static recursiveResolution(module: Type<any>, parent?: CoreModule): CoreModule {
        debug('Recursive resolution', module.name);
        const metadata = this.metadataFromModule(module);
        const coreModule = this.coreModuleFromMetadata(metadata, module, parent);
        if (!(metadata.imports && metadata.imports.length > 0)) {
            debug('Module resolved', coreModule);
            return coreModule;
        }
        coreModule.modules = metadata.imports.map(x => this.recursiveResolution(x, coreModule));
        return coreModule;
    }

}
