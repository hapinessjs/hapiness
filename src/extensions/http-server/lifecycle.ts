import { HookManager } from '../../core/hook';
import { LifecycleEventsEnum, LifecycleHooksEnum } from './enums';
import { RouteBuilder, CoreRoute } from './route';
import { Request, ReplyWithContinue, Server } from 'hapi';
import * as Debug from 'debug';
const debug = Debug('lifecycle/hook');

export class HttpRequestInfo {
    constructor(public id: string) {}
}

export class LifecycleManager {

    private static eventName = 'onEvent';

    /**
     * Initialize the lifecycle hooks
     * for a route
     *
     * @param  {MainModule} main
     */
    static routeLifecycle(server: Server, routes: CoreRoute[]) {
        server.ext(<any>LifecycleEventsEnum.OnPreAuth.toString(), (request: Request, reply: ReplyWithContinue) => {
            const route = this.findRoute(request, routes);
            /* istanbul ignore else */
            if (route && route.token) {
                const reqInfo = new HttpRequestInfo(request.id);
                route.providers = route.providers.concat({ provide: HttpRequestInfo, useValue: reqInfo });
                request['_hapinessRoute'] = RouteBuilder.instantiateRouteAndDI(route);
                this.eventHandler(LifecycleHooksEnum.OnPreAuth, routes, request, reply);
            } else {
                reply.continue();
            }
        });

        server.ext(<any>LifecycleEventsEnum.OnPostAuth.toString(),
            (request, reply) => this.eventHandler(LifecycleHooksEnum.OnPostAuth, routes, request, reply));

        server.ext(<any>LifecycleEventsEnum.OnPreHandler.toString(),
            (request, reply) => this.eventHandler(LifecycleHooksEnum.OnPreHandler, routes, request, reply));

        server.ext(<any>LifecycleEventsEnum.OnPostHandler.toString(),
            (request, reply) => this.eventHandler(LifecycleHooksEnum.OnPostHandler, routes, request, reply));

        server.ext(<any>LifecycleEventsEnum.OnPreResponse.toString(),
            (request, reply) => {
                this.eventHandler(LifecycleHooksEnum.OnPreResponse, routes, request, reply);
                request['_hapinessRoute'] = undefined;
            });
    }

    private static findRoute(request: Request, routes: CoreRoute[]): CoreRoute {
        return routes.find(r => ((r.method === request.route.method || r.method.indexOf(request.route.method) > -1) &&
                r.path === request.route.path));
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
    private static eventHandler(hook: LifecycleHooksEnum, routes: CoreRoute[], request, reply) {
        const route = this.findRoute(request, routes);
        if (request['_hapinessRoute'] && HookManager.hasLifecycleHook(hook.toString(), route.token)) {
            HookManager.triggerHook(hook.toString(), route.token, request['_hapinessRoute'], [request, reply]);
        } else {
            reply.continue();
        }
    }
}

/**
 * Request lifecycle component Hook
 *
 * @returns void
 */
export interface OnEvent { onEvent(request: Request, reply: ReplyWithContinue): void; }
