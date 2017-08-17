import { Observable } from 'rxjs';
import { InternalLogger } from './logger';
import { extractMetadataByDecorator } from './metadata';
import { HapinessModule, Type, InjectionToken } from './decorators';
import { CoreModule, CoreProvide, CoreModuleWithProviders, ModuleLevel } from './interfaces';
import { DependencyInjection } from './di';

export class ModuleManager {

    private static decoratorName = 'HapinessModule';

    private static logger = new InternalLogger('module');

    /**
     * Resolve into a tree of CoreModule
     *
     * @param  {any} module
     * @returns Observable
     */
    static resolve(module: any): Observable<CoreModule> {
        this.logger.debug(`Resolving module '${module.name}'`);
        return this.resolution(module);
    }

    static instantiate(module: CoreModule, providers?: CoreProvide[]): Observable<CoreModule> {
        this.logger.debug(`Instantiation of module '${module.name}'`);
        return this.instantiation(module, providers);
    }

    /**
     * Get all the tree modules
     *
     * @param  {CoreModule} module
     * @returns CoreModule
     */
    static getModules(module: CoreModule): CoreModule[] {
        const lookup = (_module: CoreModule) => {
            return []
                .concat(_module)
                .concat([]
                    .concat(_module.modules)
                    .filter(_ => !!_)
                    .map(m => lookup(m))
                    .reduce((a, c) => a.concat(c), [])
                );
        };
        return lookup(module);
    }

    /**
     * Helper to convert provider
     * to a CoreProvide type
     *
     * @param  {any} provider
     * @returns CoreProvide
     */
    static toCoreProvider(provider: any): CoreProvide {
        return <CoreProvide>(!!provider.provide ?
            provider :
            { provide: provider, useClass: provider }
        );
    }

    /**
     * ===========================================================================
     *
     *  MODULE RESOLUTION
     *
     * ===========================================================================
     */

    /**
     * Process module to CoreModule type
     * from metadata and the children
     *
     * @param  {any} module
     * @param  {CoreModule} parent?
     * @returns Observable
     */
    private static resolution(module: any, parent?: CoreModule): Observable<CoreModule> {
        return Observable
            .of(module)
            .map(_ => this.toCoreModuleWithProviders(_))
            .flatMap(cmwp =>
                this
                    .extractMetadata(cmwp.module)
                    .map(_ => ({ metadata: _, moduleWithProviders: cmwp }))
            )
            .flatMap(mcmwp =>
                this
                    .metadataToCoreModule(mcmwp.metadata, mcmwp.moduleWithProviders, parent)
                    .map(_ => this.coreModuleParentConfigProviders(_))
                    .map(_ => Object.assign({ module: _ }, mcmwp))
            )
            .flatMap(data =>
                Observable
                    .from(data.metadata.imports || [])
                    .flatMap(_ => this.resolution(_, data.module))
                    .toArray()
                    .do(_ => this.logger.debug(`'${data.module.name}' got ${_.length} children`))
                    .map(_ => <CoreModule>Object.assign({ modules: _ }, data.module))
            )
    }

    /**
     * FIX for exported providers
     * that need internal config
     *
     * @todo find a better solution
     * @param  {CoreModule} module
     * @returns CoreModule
     */
    private static coreModuleParentConfigProviders(module: CoreModule): CoreModule {
        module.providers = []
            .concat(module.providers)
            .concat((module.parent && module.parent.providers) ?
                module.parent.providers.filter(_ => (_.provide instanceof InjectionToken)) :
                []
            )
            .filter(_ => !!_);
        return module;
    }

    /**
     * Convert metadata to CoreModule type
     *
     * @param  {HapinessModule} metadata
     * @param  {CoreModuleWithProviders} moduleWithProviders
     * @param  {CoreModule} parent?
     * @returns Observable
     */
    private static metadataToCoreModule(
            metadata: HapinessModule,
            moduleWithProviders: CoreModuleWithProviders,
            parent?: CoreModule): Observable<CoreModule> {

        return Observable
            .of({
                parent,
                token: moduleWithProviders.module,
                name: moduleWithProviders.module.name,
                version: metadata.version,
                exports: metadata.exports || [],
                declarations: metadata.declarations || [],
                providers: (metadata.providers || [])
                    .concat(moduleWithProviders.providers)
                    .map(_ => this.toCoreProvider(_)),
                level: !!parent ?
                    parent.level === ModuleLevel.ROOT ?
                    ModuleLevel.PRIMARY :
                    ModuleLevel.SECONDARY :
                    ModuleLevel.ROOT
            })
            .do(_ => this.logger.debug(`Build CoreModule for '${_.name}'`));
    }

    /**
     * Get HapinessModule metadata type
     * if does not exist, throw an error
     *
     * @param  {Type<any>} module
     * @returns Observable
     */
    private static extractMetadata(module: Type<any>): Observable<HapinessModule> {
        return Observable
            .of(extractMetadataByDecorator<HapinessModule>(module, this.decoratorName))
            .flatMap(_ => !!_ ?
                Observable.of(_) :
                Observable.throw(new Error(`Module '${module ? module.name : null}' resolution failed: No metadata`))
            )
    }

    /**
     * Make sure to convert module into
     * a CoreModuleWithProviders type
     *
     * @param  {CoreModuleWithProviders|Type<any>} module
     * @returns CoreModuleWithProviders
     */
    private static toCoreModuleWithProviders(module: CoreModuleWithProviders | Type<any>): CoreModuleWithProviders {
        return <CoreModuleWithProviders>((module && module['module']) ?
            module :
            {
                module,
                providers: []
            });
    }

        /**
     * ===========================================================================
     *
     *  MODULE INSTANTIATION
     *
     * ===========================================================================
     */

    /**
     * Create the module's DI
     * and instantiate the module
     *
     * @param  {CoreModule} module
     * @param  {CoreProvide[]} providers?
     * @param  {CoreModule} parent?
     * @returns Observable
     */
    private static instantiation(module: CoreModule, providers?: CoreProvide[], parent?: CoreModule): Observable<CoreModule> {
        return Observable
            .of(module)
            .flatMap(_ =>
                Observable
                    .from(_.modules)
                    .flatMap(child => this.instantiation(child, providers, parent))
                    .toArray()
                    .map(children => <CoreModule>Object.assign({}, _, { modules: children }))
            )
            .flatMap(_ =>
                DependencyInjection
                    .createAndResolve(this.collectProviders(_, providers))
                    .map(di => <CoreModule>Object.assign({ di }, _))
            )
            .flatMap(_ =>
                DependencyInjection
                    .instantiateComponent(_.token, _.di)
                    .map(instance => <CoreModule>Object.assign({ instance }, _))
            );
    }

    /**
     * Collect all providers to
     * inject into the DI
     *
     * @param  {HapinessModule} module
     */
    private static collectProviders(module: CoreModule, providers?: CoreProvide[]): CoreProvide[] {
        this.logger.debug(`Collect providers for '${module.name}'`);
        return []
            .concat(module.providers)
            .concat(providers)
            .filter(_ => !!_)
            .concat(this.extractExportedProviders(module));
    }

    /**
     * Extract exported children providers
     *
     * @param  {CoreModule} module
     * @returns CoreProvide[]
     */
    private static extractExportedProviders(module: CoreModule): CoreProvide[] {
        this.logger.debug(`Extract exported children providers for '${module.name}'`);
        return []
            .concat(module.modules)
            .filter(_ => (!!_.exports && _.exports.length > 0))
            .map(_ => []
                .concat(_.exports)
                .concat(
                    _.providers
                        .filter(__ => (__.provide instanceof InjectionToken)))
                )
            .reduce((a, c) => a.concat(c), [])
            .filter(_ => !!_)
            .map(_ => this.toCoreProvider(_));
    }
}
