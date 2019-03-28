import { ReflectiveInjector, ResolvedReflectiveFactory, ResolvedReflectiveProvider, Type } from 'injection-js';
import { from, Observable, of } from 'rxjs';
import { map, reduce, tap } from 'rxjs/operators';
import { CoreProvide } from './interfaces';
import { InternalLogger } from './logger';
import { ReflectiveDependency } from 'injection-js/reflective_provider';
import { Extension } from './extensions';
// import { ReflectiveDependency } from 'injection-js/reflective_provider';

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
    static createAndResolve(providers: Array<Type<any> | CoreProvide>, parent?: ReflectiveInjector): Observable<ReflectiveInjector> {
        return of(parent)
            .pipe(
                map(_ => !!_ ?
                    parent.resolveAndCreateChild(<any>providers) :
                    ReflectiveInjector.resolveAndCreate(<any>providers)
                ),
                tap(_ => this.logger.debug(`DI created, providers: ${providers.length}`))
            );
    }

    /**
     * Instantiate a component
     * resolving its dependencies
     * without inject the component
     * into the DI
     *
     * @param  {Type<T>} component
     * @param  {ReflectiveInjector} di
     * @returns T
     */
    static instantiateComponent<T>(component: Type<T>, di: ReflectiveInjector): Observable<T> {
        return from(ReflectiveInjector.resolve([ component ]))
            .pipe(
                reduce((a, x: ResolvedReflectiveProvider) => a.concat(x.resolvedFactories), <any>[]),
                map(_ => _.reduce((a, r: ResolvedReflectiveFactory) => a.concat(r.dependencies), [])),
                map(_ => _.filter(__ => !!__)),
                tap(_ => this.logger.debug(`Component '${component.name}' deps: ${_.length}`)),
                map(_ => _.map(d => di[ '_getByReflectiveDependency' ](d))),
                map(_ => Reflect.construct(component, _))
            );
    }

    private static getComponentDeps<T>(component: Type<T>, di: ReflectiveInjector): any[] {
        return ReflectiveInjector.resolve([ component ])
            .reduce((a, x: ResolvedReflectiveProvider) => a.concat(x.resolvedFactories), <ResolvedReflectiveFactory[]>[])
            .reduce((a, r: ResolvedReflectiveFactory) => a.concat(r.dependencies), <ReflectiveDependency[]>[])
            .filter(__ => !!__)
            .map(d => di[ '_getByReflectiveDependency' ](d));
    }

    static instantiateExtension<T>(extension: Type<T>, di: ReflectiveInjector): T {
        const abstractDeps = this.getComponentDeps(<any>Extension, di);
        const extDeps = this.getComponentDeps(extension, di);
        return Reflect.construct(extension, extDeps && extDeps.length ? extDeps : abstractDeps);
    }

    static getAllDeps<T>(component: Type<T>): any[] {
        return ReflectiveInjector.resolve([ component ])
            .reduce((a, x: ResolvedReflectiveProvider) => a.concat(x.resolvedFactories), <ResolvedReflectiveFactory[]>[])
            .reduce((a, r: ResolvedReflectiveFactory) => a.concat(r.dependencies), <ReflectiveDependency[]>[])
            .filter(Boolean)
            .map(dep => dep.key.token)
            .map(provider => this.getAllDeps(<any>provider).concat(provider))
            .reduce((a, c) => a.concat(c), []);
    }

    static getDeps<T>(component: Type<T>): any[] {
        return ReflectiveInjector.resolve([ component ])
            .reduce((a, x: ResolvedReflectiveProvider) => a.concat(x.resolvedFactories), <ResolvedReflectiveFactory[]>[])
            .reduce((a, r: ResolvedReflectiveFactory) => a.concat(r.dependencies), <ReflectiveDependency[]>[])
            .filter(Boolean)
            .map(dep => dep.key.token);
    }
}
