import { extractMetadataByDecorator } from '../../core/metadata';
import { Route } from './decorators';
import { CoreModule, CoreProvide, DependencyInjection } from '../../core';
import { Type } from '../../core/decorators';
import { Request, ReplyWithContinue, ReplyNoContinue } from 'hapi';
import * as Hoek from 'hoek';
import * as Boom from 'boom';
import * as Debug from 'debug';
const debug = Debug('hapiness:extension:httpserver:route');

export { Request, ReplyWithContinue, ReplyNoContinue };

interface InternalType {
    route: Route;
    token: Type<any>;
}

export interface ValidateConfig {
    params?: any;
    query?: any;
    payload?: any;
    response?: any;
}

export interface RouteConfig {
    description?: string;
    notes?: string;
    tags?: string[];
    validate?: ValidateConfig;
    auth?: any;
    bind?: any;
    cache?: any;
    compression?: any;
    cors?: any;
    ext?: any;
    files?: any;
    id?: any;
    json?: any;
    jsonp?: any;
    log?: any;
    plugins?: any;
    pre?: any;
    response?: any;
    security?: any;
    state?: any;
    timeout?: any;
}

/**
 * CoreRoute Type
 * Represents an Http Route
 */
export interface CoreRoute {
    token: Type<any> | any;
    path: string;
    method: string | string[];
    module: CoreModule;
    providers?: CoreProvide[];
    config?: RouteConfig;
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
    public static buildRoutes(module: CoreModule): CoreRoute[] {
        Hoek.assert(!!module, Boom.create(500, 'Please provide a module'));
        debug('build routes', module.name);
        const routes = this.metadataFromDeclarations(module.declarations)
            .map(data => this.coreRouteFromMetadata(data.route, data.token, module));
        return routes;
    }

    /**
     * Instantiate a new Route
     * with its own DI/request
     *
     * /!\ Create a DI/req give some
     * perf issues. Still investigating
     * for a solution. For now, we provide
     * just the DI's module
     *
     * @param  {CoreRoute} route
     * @returns Type
     */
    public static instantiateRouteAndDI(route: CoreRoute): Type<any> {
        debug('instantiate route', route.method, route.path);
        if (route.providers && route.providers.length > 0) {
            console.warn(`${route.path} - Providers for a route are not available`);
        }
        return DependencyInjection.instantiateComponent(
            <Type<any>>route.token,
            /*DependencyInjection.createAndResolve(route.providers
                .map(p => Object.assign(<Type<any>>{}, p)), route.module.di
            )*/route.module.di
        );
    }

    /**
     * Transform metadata to instance CoreRoute
     *
     * @param  {Route} data
     * @returns CoreRoute
     */
    private static coreRouteFromMetadata(data: Route, token: Type<any>, module: CoreModule): CoreRoute {
        const providers = data.providers || [];
        const method = Array.isArray(data.method) ?
            data.method.map(_ => _.toLowerCase()) :
            data.method.toString().toLowerCase();
        return {
            token,
            module,
            config: data.config,
            path: data.path,
            method,
            providers: providers.map((p: any) => !!p.provide ? p : { provide: p, useClass: p })
        };
    }

    /**
     * Extract metadata filtered by route
     * from the declarations provided
     *
     * @param  {Type<any>} declarations
     * @returns Route
     */
    private static metadataFromDeclarations(declarations: Type<any> | Type<any>[]): InternalType[] {
        debug('metadata from declarations', declarations.length);
        return [].concat(declarations)
            .map(t => {
                return {
                    route: extractMetadataByDecorator<Route>(t, this.decoratorName),
                    token: <Type<any>>t
                };
            })
            .filter(t => !!t.route);
    }

}

/**
 * Route Handler
 * called on Http Get request
 *
 * @returns void
 */
export interface OnGet { onGet(request: Request, reply: ReplyNoContinue): void; }

/**
 * Route Handler
 * called on Http Post request
 *
 * @returns void
 */
export interface OnPost { onPost(request: Request, reply: ReplyNoContinue): void; }

/**
 * Route Handler
 * called on Http Put request
 *
 * @param  {Error} error
 * @returns void
 */
export interface OnPut { onPut(request: Request, reply: ReplyNoContinue): void; }

/**
 * Route Handler
 * called on Http Patch request
 *
 * @param  {string} module
 * @returns void
 */
export interface OnPatch { onPatch(request: Request, reply: ReplyNoContinue): void; }

/**
 * Route Handler
 * called on Http Options request
 *
 * @param  {string} module
 * @returns void
 */
export interface OnOptions { onOptions(request: Request, reply: ReplyNoContinue): void; }

/**
 * Route Handler
 * called on Http Delete request
 *
 * @param  {string} module
 * @returns void
 */
export interface OnDelete { onDelete(request: Request, reply: ReplyNoContinue): void; }

/**
 * OnPreAuth Lifecycle hook
 *
 * @param  {Request} request
 * @param  {Reply} reply
 * @returns void
 */
export interface OnPreAuth { onPreAuth(request: Request, reply: ReplyWithContinue ): void; }

/**
 * OnPostAuth Lifecycle hook
 *
 * @param  {Request} request
 * @param  {Reply} reply
 * @returns void
 */
export interface OnPostAuth { onPostAuth(request: Request, reply: ReplyWithContinue ): void; }

/**
 * OnPreHandler Lifecycle hook
 *
 * @param  {Request} request
 * @param  {Reply} reply
 * @returns void
 */
export interface OnPreHandler { onPreHandler(request: Request, reply: ReplyWithContinue ): void; }

/**
 * OnPostHandler Lifecycle hook
 *
 * @param  {Request} request
 * @param  {Reply} reply
 * @returns void
 */
export interface OnPostHandler { onPostHandler(request: Request, reply: ReplyWithContinue ): void; }

/**
 * OnPreResponse Lifecycle hook
 *
 * @param  {Request} request
 * @param  {Reply} reply
 * @returns void
 */
export interface OnPreResponse { onPreResponse(request: Request, reply: ReplyWithContinue ): void; }
