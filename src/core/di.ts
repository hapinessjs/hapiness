import { ReflectiveInjector } from 'injection-js';
import { Type } from 'injection-js/facade/type';
import { ReflectiveDependency, ResolvedReflectiveProvider, ResolvedReflectiveFactory } from 'injection-js/reflective_provider';

export class DependencyInjection {

    /**
     * Create a new DI and
     * can inherits from a parent DI
     *
     * @param  {Type<T>[]} providers
     * @param  {ReflectiveInjector} parent?
     * @returns ReflectiveInjector
     */
    static createAndResolve(providers: Type<any>[], parent?: ReflectiveInjector): ReflectiveInjector {
        return parent ? parent.resolveAndCreateChild(providers)
        : ReflectiveInjector.resolveAndCreate(providers);
    }

    /**
     * Instanciate a component
     * resolving its dependencies
     * without inject the component
     * into the DI
     *
     * @param  {Type<T>} component
     * @param  {ReflectiveInjector} di
     * @returns T
     */
    static instantiateComponent<T>(component: Type<T>, di: ReflectiveInjector): T {
        const reflectiveDeps: ReflectiveDependency[] = ReflectiveInjector.resolve([component])
            .reduce((a, x: ResolvedReflectiveProvider) => a.concat(x.resolvedFactories), [])
            .reduce((a, r: ResolvedReflectiveFactory) => a.concat(r.dependencies), []);

        const deps = reflectiveDeps.map(d => di.get(d.key.token));
        return Reflect.construct(component, deps);
    }

    /**
     * Instanciate components
     * resolving dependencies
     * without inject the components
     * into the DI
     *
     * @param  {Type<T>[]} components
     * @param  {ReflectiveInjector} di
     * @returns Array
     */
    /*static instantiateComponents<T>(components: Type<T>[], di: ReflectiveInjector): Array<T> {
        return components.map(c => this.instantiateComponent(c, di));
    }*/

}
