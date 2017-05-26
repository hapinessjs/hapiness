import { eRouteLifecycleHooks, RouteLifecycleHook } from '../route/hook';
import { RouteBuilder } from '../route';
import { CoreModule, CoreRoute, DependencyInjection, MainModule } from './';
import { reflector } from '../externals/injection-js/reflection/reflection';
import { Observable } from 'rxjs/Observable';
import { Request, ReplyWithContinue } from 'hapi';
import * as uuid from 'uuid';
import * as Debug from 'debug';
const debug = Debug('lifecycle/hook');

export class HttpRequestInfo {
    constructor(public id: string) {}
}

export class LifecycleManager {

    private static eventName = 'onEvent';

    /**
     * Check if the hook implemented
     *
     * @param  {any} token
     * @returns boolean
     */
    public static hasLifecycleHook(token: any): boolean {
        debug('Check hook', this.eventName, token.name);
        return reflector.hasLifecycleHook(token, this.eventName);
    }

    /**
     * Trigger the hook if
     * it is implemented
     *
     * @param  {} lifecycle
     * @param  {} instance
     * @param  {any[]} args
     * @returns Observable
     */
    public static triggerHook(lifecycle, instance, args: any[]) {
        debug('Trigger hook', this.eventName, lifecycle.name, this.hasLifecycleHook(lifecycle), instance);
        if (this.hasLifecycleHook(lifecycle)) {
            Reflect.apply(instance[this.eventName], instance, args);
        }
    }

    /**
     * Initialize the lifecycle hooks
     * for a route
     *
     * @param  {MainModule} main
     */
    static routeLifecycle(main: MainModule) {

        main.server.ext('onPreAuth', (request, reply) => {
            const route = this.findRoute(main, request.route.method, request.route.path);
            if (route && route.token) {
                const reqInfo = new HttpRequestInfo(request.id);
                route.providers = route.providers.concat({ provide: HttpRequestInfo, useValue: reqInfo });
                request['_hapinessRoute'] = RouteBuilder.instantiateRouteAndDI(route);
                this.eventHandler(eRouteLifecycleHooks.OnPreAuth, main, request, reply);
            } else {
                reply.continue();
            }
        });

        main.server.ext('onPostAuth', (request, reply) => this.eventHandler(eRouteLifecycleHooks.OnPostAuth, main, request, reply));

        main.server.ext('onPreHandler', (request, reply) => this.eventHandler(eRouteLifecycleHooks.OnPreHandler, main, request, reply));

        main.server.ext('onPostHandler', (request, reply) => this.eventHandler(eRouteLifecycleHooks.OnPostHandler, main, request, reply));

        main.server.ext('onPreResponse', (request, reply) => this.eventHandler(eRouteLifecycleHooks.OnPreResponse, main, request, reply));
    }

    /**
     * Find the route and call
     * the hook if the route component
     * implements it
     *
     * @param  {eRouteLifecycleHooks} event
     * @param  {MainModule} mainModule
     * @param  {} request
     * @param  {} reply
     */
    private static eventHandler(event: eRouteLifecycleHooks, mainModule: MainModule, request, reply) {
        const route = this.findRoute(mainModule, request.route.method, request.route.path);
        if (request['_hapinessRoute'] && RouteLifecycleHook.hasLifecycleHook(event, route.token)) {
            RouteLifecycleHook.triggerHook(event, route.token, request['_hapinessRoute'], [request, reply]);
        } else {
            reply.continue();
        }
    }

    /**
     * Find a route by method and path
     *
     * @param  {CoreModule} module
     * @param  {string} method
     * @param  {string} path
     * @returns CoreRoute
     */
    private static findRoute(module: CoreModule, method: string, path: string): CoreRoute {
        const lookup = (_module: CoreModule) => {
            const found = _module.routes.find(r => (r.method === method && r.path === path));
            if (!!found) {
                return found;
            } else {
                if (_module.modules && _module.modules.length > 0) {
                    return _module.modules.reduce((acc, cur) => acc.concat(lookup(cur)), [])
                        .filter(r => !!r)
                        .pop();
                }
                return;
            }
        };
        return Object.assign({}, lookup(module));
    }
}

/**
 * Request lifecycle component Hook
 *
 * @returns void
 */
export interface OnEvent { onEvent(request: Request, reply: ReplyWithContinue): void; }
