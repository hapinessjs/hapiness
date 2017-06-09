import { extractMetadataByDecorator } from './metadata';
import { Type, HapinessModule } from './decorators';
import { DependencyInjection } from './di';
import { reflector } from '../externals/injection-js/reflection/reflection';
import { ReflectiveInjector } from '../externals/injection-js';
import { Server } from 'hapi';
import * as Hoek from 'hoek';
const debug = require('debug')('hapiness:module');

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
    token: Type<any> | any;
    name: string;
    version: string;
    instance?: any;
    level: ModuleLevel;
    di?: ReflectiveInjector;
    providers?: CoreProvide[];
    modules?: CoreModule[];
    parent?: CoreModule;
    exports?: Type<any>[] | any[];
    declarations?: Type<any>[] | any[];
    // routes?: CoreRoute[];
    libs?: Type<any>[];
}

/**
 * CoreModuleWithProviders Type
 * Used to pass data while module importation
 */
export interface CoreModuleWithProviders {
    module: Type<any>;
    providers: CoreProvide[];
}

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
        debug('building module', module.name);
        const moduleResolved = this.recursiveResolution(module, null, providers);
        debug('module resolved', module.name);
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
        debug(`looking for nested module ${name} in ${module.name}`);
        if (module.modules && module.modules.length > 0 &&
            module.modules.find(m => m.name === name)) {
                debug(`found nested module ${name} in ${module.name}`);
                return module.modules.find(m => m.name === name);
        } else if (module.modules && module.modules.length > 0) {
            debug(`looking in sub-modules`);
            return module.modules
                .map(m => this.findNestedModule(name, m))
                .filter(m => !!m)
                .shift();
        }
        debug(`didn't find module ${name}`);
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
        debug('converting module to CoreModule', module.name);
        return {
            parent,
            token: module,
            name: module.name,
            version: data.version,
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
        debug('recursive resolution', module.name);
        const metadata = this.metadataFromModule(module);
        const coreModule = this.coreModuleFromMetadata(metadata, module, parent);
        coreModule.modules = (metadata.imports && metadata.imports.length > 0) ?
            metadata.imports.map(x => this.recursiveResolution(x, coreModule, providers)) : [];
        coreModule.di = DependencyInjection.createAndResolve(this.collectProviders(coreModule, _providers));
        coreModule.instance = DependencyInjection.instantiateComponent(module, coreModule.di);
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
}
