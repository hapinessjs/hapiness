import { Request } from 'hapi';
import { from, Observable, of } from 'rxjs';
import { filter, flatMap, map, toArray } from 'rxjs/operators';
import { CoreModule, DependencyInjection, extractMetadataByDecorator, Type } from '../../core';
import { Route } from './decorators';
import { CoreRoute } from './interfaces';

interface InternalType {
    route: Route;
    token: Type<any>;
}

export class HttpRequestInfo {
}

export class RouteBuilder {

    /**
     * Helper to extract metadata
     * @property {string} decoratorName
     */
    private static decoratorName = 'Route';

    /**
     * Entrypoint to build a CoreRoute
     * Get the metadata and build the
     * route instance
     *
     * @param  {CoreModule} module
     * @returns CoreRoute
     */
    public static buildRoutes(module: CoreModule): Observable<CoreRoute> {
        return of(module)
            .pipe(
                filter(_ => !!_),
                flatMap(_ => this.metadataFromDeclarations(_.declarations)),
                flatMap(_ => this.coreRouteFromMetadata(_.route, _.token, module))
            );
    }

    /**
     * Instantiate a new Route
     * with its own DI/request
     *
     * @param  {CoreRoute} route
     * @param  {Request} request
     * @returns Observable
     */
    public static instantiateRouteAndDI<T>(route: CoreRoute, request: Request): Observable<T> {
        return of(request)
            .pipe(
                map(_ => ({
                    query: Object.assign({}, request.query),
                    params: Object.assign({}, request.params),
                    headers: Object.assign({}, request.headers),
                    payload: Object.assign({}, request.payload),
                    id: request.id
                })),
                map(_ => ({ provide: HttpRequestInfo, useValue: _ })),
                map(_ => [].concat(route.providers).concat(_)),
                flatMap(_ => DependencyInjection.createAndResolve(_, route.module.di)),
                flatMap(_ => DependencyInjection.instantiateComponent(route.token, _))
            );
    }

    /**
     * Transform metadata to instance CoreRoute
     *
     * @param  {Route} data
     * @param  {Type} token
     * @param  {CoreModule} module
     * @returns CoreRoute
     */
    private static coreRouteFromMetadata(data: Route, token: Type<any>, module: CoreModule): Observable<CoreRoute> {
        return of(data)
            .pipe(
                flatMap(_ =>
                    from([].concat(_.method))
                        .pipe(
                            map(__ => <string>__.toLowerCase()),
                            toArray(),
                            map(__ => ({ data: _, methods: __ }))
                        )
                ),
                map(_ => (<CoreRoute>{
                    token,
                    module,
                    config: _.data.config,
                    path: _.data.path,
                    method: _.methods,
                    labels: _.data.labels,
                    providers: []
                        .concat(_.data.providers)
                        .filter(p => !!p)
                        .map(p => p.provide ? p : { provide: p, useClass: p })
                }))
            );
    }

    /**
     * Extract metadata filtered by route
     * from the declarations provided
     *
     * @param  {Type<any>} declarations
     * @returns Route
     */
    private static metadataFromDeclarations(declarations: Type<any>[]): Observable<InternalType> {
        return from([].concat(declarations))
            .pipe(
                filter(_ => !!_ && !!extractMetadataByDecorator(_, this.decoratorName)),
                map(_ => ({ token: _, route: extractMetadataByDecorator<Route>(_, this.decoratorName) }))
            );
    }
}
