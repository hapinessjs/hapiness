import { CoreModule } from '../../core/interfaces';
import { CoreRoute } from './interfaces';
import { Observable } from 'rxjs';
import { Type } from '../../core/decorators';
import { Route } from './decorators';
import { extractMetadataByDecorator } from '../../core/metadata';
import { DependencyInjection } from '../../core/di';
import { Request } from 'hapi';

interface InternalType {
    route: Route;
    token: Type<any>;
}

export class HttpRequestInfo {
    query: {[key: string]: any};
    params: {[key: string]: string};
    headers: {[key: string]: string};
    payload: any;
    credentials: {[key: string]: any};
    id: string;
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
        return Observable
            .of(module)
            .filter(_ => !!_)
            .flatMap(_ => this.metadataFromDeclarations(_.declarations))
            .flatMap(_ => this.coreRouteFromMetadata(_.route, _.token, module));
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
        return Observable
            .of(request)
            .map(_ => ({
                query: Object.assign({}, request.query),
                params: Object.assign({}, request.params),
                headers: Object.assign({}, request.headers),
                payload: Object.assign({}, request.payload),
                credentials: Object.assign({}, request.auth.credentials),
                id: request.id
            }))
            .map(_ => ({ provide: HttpRequestInfo, useValue: _ }))
            .map(_ => [].concat(route.providers).concat(_))
            .flatMap(_ => DependencyInjection.createAndResolve(_, route.module.di))
            .flatMap(_ => DependencyInjection.instantiateComponent(route.token, _));
    }

    /**
     * Transform metadata to instance CoreRoute
     *
     * @param  {Route} data
     * @returns CoreRoute
     */
    private static coreRouteFromMetadata(data: Route, token: Type<any>, module: CoreModule): Observable<CoreRoute> {
        return Observable
            .of(data)
            .flatMap(_ =>
                Observable
                    .from([].concat(_.method))
                    .map(__ => <string>__.toLowerCase())
                    .toArray()
                    .map(__ => ({ data: _, methods: __ }))
            )
            .map(_ => (<CoreRoute>{
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
            }));
    }

    /**
     * Extract metadata filtered by route
     * from the declarations provided
     *
     * @param  {Type<any>} declarations
     * @returns Route
     */
    private static metadataFromDeclarations(declarations: Type<any>[]): Observable<InternalType> {
        return Observable
            .from([].concat(declarations))
            .filter(_ => !!_ && !!extractMetadataByDecorator(_, this.decoratorName))
            .map(_ => ({ token: _, route: extractMetadataByDecorator<Route>(_, this.decoratorName) }))
    }
}
