import { RouteBuilder } from '../route';
import { CoreModule, CoreModuleWithProviders, CoreProvide, DependencyInjection, HapinessModule, Lib } from '../core';
import { extractMetadataByDecorator } from '../util';
import { Type } from '../externals/injection-js/facade/type';
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

/**
 * ModuleBuilder
 * Class used to build a module
 */
export class ModuleBuilder {

    /**
     * Helper to extract metadata
     * @property {string} decoratorName
     */
    private static decoratorName = 'HapinessModule';

    /**
     * Entrypoint to build a CoreModule
     * Get the metadata and build the
     * module instance with the DI
     *
     * @param  {Type<any>} module
     * @param  {CoreProvide[]} providers
     * @returns CoreModule
     */
     public static buildModule(module: Type<any>, providers?: CoreProvide[]): CoreModule {
        debug('Module entrypoint', module.name);
        const moduleResolved = this.recursiveResolution(module, null, providers);
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
            declarations: data.declarations || [],
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
    public static metadataFromModule(module: Type<any>): HapinessModule {
        const metadata = <HapinessModule>extractMetadataByDecorator(module, this.decoratorName);
        Hoek.assert(!!metadata, new Error('Please define a Module with the right annotation'));
        return metadata;
    }

    /**
     * Resolve recursively
     * each module imported
     *
     * @todo Fix circular importation !!!
     * @param  {Type<any>|CoreModuleWithProviders} module
     * @param  {CoreModule} parent
     * @param  {CoreProvide[]} providers
     * @returns CoreModule
     */
    private static recursiveResolution(module: Type<any>, parent?: CoreModule, providers?: CoreProvide[]): CoreModule {
        let _providers = [].concat(providers);
        if (module['module'] && module['providers']) {
            _providers = _providers.concat(module['providers']);
            module = module['module'];
        }
        debug('Recursive resolution', module.name);
        const metadata = this.metadataFromModule(module);
        const coreModule = this.coreModuleFromMetadata(metadata, module, parent);
        coreModule.modules = (metadata.imports && metadata.imports.length > 0) ?
            metadata.imports.map(x => this.recursiveResolution(x, coreModule, providers)) : [];
        coreModule.di = DependencyInjection.createAndResolve(this.collectProviders(coreModule, _providers));
        coreModule.instance = DependencyInjection.instantiateComponent(module, coreModule.di);
        coreModule.routes = RouteBuilder.buildRoute(coreModule);
        coreModule.libs = this.instantiateLibs(coreModule);
        return coreModule;
    }

    /**
     * Collect all providers to
     * inject into the DI
     *
     * @param  {HapinessModule} module
     */
    private static collectProviders(module: CoreModule, providers?: CoreProvide[]): any[] {
        return <any>[].concat(module.providers || [])
            .concat(providers)
            .filter(x => !!x)
            .concat((module.modules || []).reduce((a, c) => a.concat(c.exports || []), []));
    }

    /**
     * Instantiate and return array of libs
     *
     * @param  {CoreModule} module
     * @returns Type
     */
    private static instantiateLibs(module: CoreModule): Type<any>[] {
        return [].concat(module.declarations).filter(decl => !!extractMetadataByDecorator(decl, 'Lib'))
            .map(lib => <Type<any>>DependencyInjection.instantiateComponent(lib, module.di));
    }
}
