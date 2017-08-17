import { ReflectiveInjector } from '../externals/injection-js';
import { Type } from '../externals/injection-js/facade/type';
import {
    ReflectiveDependency,
    ResolvedReflectiveProvider,
    ResolvedReflectiveFactory
} from '../externals/injection-js/reflective_provider';
import { CoreProvide } from './interfaces';
import { InternalLogger } from './logger';
import { Observable } from 'rxjs';

export class DependencyInjection {

    private static logger = new InternalLogger('di');

    /**
     * Create a new DI and
     * can inherits from a parent DI
     *
     * @param  {Type<T>[]} providers
     * @param  {ReflectiveInjector} parent?
     * @returns Observable<ReflectiveInjector>
     */
    static createAndResolve(providers: Type<any>[] | CoreProvide[], parent?: ReflectiveInjector): Observable<ReflectiveInjector> {
        return Observable
            .of(parent)
            .map(_ => !!_ ?
                parent.resolveAndCreateChild(<any>providers) :
                ReflectiveInjector.resolveAndCreate(<any>providers)
            )
            .do(_ => this.logger.debug(`DI created, providers: ${providers.length}`));
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
    static instantiateComponent<T>(component: Type<T>, di: ReflectiveInjector): Observable<T> {
        return Observable
            .from(ReflectiveInjector.resolve([component]))
            .reduce((a, x: ResolvedReflectiveProvider) => a.concat(x.resolvedFactories), <any>[])
            .map(_ => _.reduce((a, r: ResolvedReflectiveFactory) => a.concat(r.dependencies), []))
            .map(_ => _.filter(__ => !!__))
            .do(_ => this.logger.debug(`Component '${component.name}' deps: ${_.length}`))
            .map(_ => _.map(d => di['_getByReflectiveDependency'](d)))
            .map(_ => Reflect.construct(component, _));
    }

}
