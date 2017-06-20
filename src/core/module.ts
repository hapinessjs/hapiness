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
export class CoreModule {
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
 * ModuleManage
 * Class used to manage modules
 */
export class ModuleManager {

    /**
     * Helper to extract metadata
     * @property {string} decoratorName
     */
    private static decoratorName = 'HapinessModule';

    /**
     * Entrypoint to resolve a CoreModule
     * Get the metadata.
     *
     * @param  {Type<any>} module
     * @param  {CoreProvide[]} providers
     * @returns CoreModule
     */
     public static resolveModule(module: any): CoreModule {
        debug('building module', module.name);
        const moduleResolved = this.recursiveResolution(module, null);
        debug('module resolved', module.name);
        return moduleResolved;
    }

    public static instantiateModule(module: CoreModule, providers?: CoreProvide[]) {
        debug('instantiate module', module.name, 'extra providers:', providers ? providers.length : 0);
        this.recursiveInstantiation(module, null, providers);
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

    public static getElements(module: CoreModule, element: string): Type<any>[] {
        Hoek.assert(!!element, 'You need to provide the element you want to get');
        const lookup = (_module: CoreModule) => {
            const els = [].concat((_module[element] && Array.isArray(_module[element])) ? _module[element] : []);
            return (_module.modules || []).map(m => lookup(m)).reduce((acc, cur) => acc.concat(cur), []).concat(els);
        }
        return lookup(module);
    }

    public static getModules(module: CoreModule): CoreModule[] {
        const lookup = (_module: CoreModule) => {
            return [].concat(_module).concat(_module.modules.map(m => lookup(m)).reduce((a, c) => a.concat(c), []));
        }
        return lookup(module);
    }

    /**
    * Transform metadata to instance CoreModule
    *
    * @param  {HapinessModule} data
    * @param  {Type<any>} module
    * @param  {CoreModule} parent
    * @returns CoreModule
    */
    private static coreModuleFromMetadata(data: HapinessModule, module: CoreModuleWithProviders, parent?: CoreModule): CoreModule {
        const providers = data.providers || [];
        debug('converting module to CoreModule', module.module.name);
        return {
            parent,
            token: module.module,
            name: module.module.name,
            version: data.version,
            exports: data.exports,
            declarations: data.declarations || [],
            providers: providers.concat(module.providers).map((p: any) => !!p.provide ? p : {provide: p, useClass: p}),
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
        debug('metadata for', module);
        const metadata = extractMetadataByDecorator<HapinessModule>(module, this.decoratorName);
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
    private static recursiveResolution(module: CoreModuleWithProviders, parent?: CoreModule): CoreModule {
        if (!module['module']) {
            module = <any>{
                module,
                providers: []
            }
        }
        debug('recursive resolution', module.module.name);
        const metadata = this.metadataFromModule(module.module);
        const coreModule = this.coreModuleFromMetadata(metadata, module, parent);
        coreModule.modules = (metadata.imports && metadata.imports.length > 0) ?
            metadata.imports.map(m => this.recursiveResolution(m, coreModule)) : [];
        return coreModule;
    }

    private static recursiveInstantiation(module: CoreModule, parent?: CoreModule, providers?: CoreProvide[]) {
        debug('recursive instantiation', module.name);
        if (module.modules && module.modules.length > 0) {
            module.modules.forEach(m => this.recursiveInstantiation(m, module, providers));
        }
        module.di = DependencyInjection.createAndResolve(this.collectProviders(module, providers));
        module.instance = DependencyInjection.instantiateComponent(module.token, module.di);
        this.instantiateLibs(module);
    }

    /**
     * Collect all providers to
     * inject into the DI
     *
     * @param  {HapinessModule} module
     */
    private static collectProviders(module: CoreModule, providers?: CoreProvide[]): any[] {
        debug('collect providers');
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

/**
 * Module Lifecycle Hook
 * called once the module has been
 * registered into the server
 *
 * @returns void
 */
export interface OnRegister { onRegister(): void; }

/**
 * Module Lifecycle Hook
 * called once the server has started
 * only for the MainModule
 *
 * @returns void
 */
export interface OnStart { onStart(): void; }

/**
 * Module Lifecycle Hook
 * called when error are catched
 *
 * @param  {Error} error
 * @returns void
 */
export interface OnError { onError(error: Error): void; }
