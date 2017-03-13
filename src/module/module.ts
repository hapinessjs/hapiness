import { HapinessModule, CoreModule, DependencyInjection } from '../core';
import { extractMetadata } from '../util';
import { ReflectiveInjector } from 'injection-js';
import { Type } from 'injection-js/facade/type';
import * as Hoek from 'hoek';
import * as Debug from 'debug';
const debug = Debug('module');

/**
 * Represents the position where
 * the module is instantiate
 */
export enum ModuleLevel {
    ROOT,
    PRIMARY,
    SECONDARY
}

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
        debug('Collect providers', providers, module.name);
        const di = DependencyInjection.createAndResolve(providers);
        return {
            parent,
            token: module,
            name: module.name,
            version: data.version,
            options: data.options || {},
            exports: data.exports,
            providers: providers.map((p: any) => !!p.provide ? p : {provide: p, useClass: p}),
            level: parent ? parent.level === ModuleLevel.ROOT ? ModuleLevel.PRIMARY : ModuleLevel.SECONDARY : ModuleLevel.ROOT
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
        const metadata = <HapinessModule>extractMetadata(module);
        Hoek.assert(!!metadata, new Error('Please define a Module with the right annotation'));
        return metadata;
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
        coreModule.modules = (metadata.imports && metadata.imports.length > 0) ?
            metadata.imports.map(x => this.recursiveResolution(x, coreModule)) : [];
        coreModule.di = DependencyInjection.createAndResolve(this.collectProviders(coreModule));
        coreModule.instance = DependencyInjection.instantiateComponent(module, coreModule.di);
        return coreModule;
    }

    /**
     * Collect all providers to
     * inject into the DI
     *
     * @param  {HapinessModule} module
     */
    private static collectProviders(module: CoreModule): any[] {
        return <any>[].concat(module.providers || [])
            .concat((module.modules || [])
                .reduce((a, c) => a.concat(c.exports || []), []));
    }

}
