import { ReflectiveInjector } from '../externals/injection-js';
import { Type } from '../externals/injection-js/facade/type';
import { ReflectiveDependency, ResolvedReflectiveProvider, ResolvedReflectiveFactory } from '../externals/injection-js/reflective_provider';

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
        try {
            const reflectiveDeps: ReflectiveDependency[] = ReflectiveInjector.resolve([component])
                .reduce((a, x: ResolvedReflectiveProvider) => a.concat(x.resolvedFactories), [])
                .reduce((a, r: ResolvedReflectiveFactory) => a.concat(r.dependencies), []);
            const deps = reflectiveDeps.map(d => di['_getByReflectiveDependency'](d));
            return Reflect.construct(component, deps);
        } catch (e) {
            console.error.apply(console, e);
        }
    }

}
