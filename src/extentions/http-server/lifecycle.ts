import { HookManager } from '../../core/hook';
import { LifecycleEventsEnum, LifecycleHooksEnum } from '../../core/enums';
import { RouteBuilder } from '../route';
import { CoreModule, CoreRoute, DependencyInjection, MainModule } from './';
import { Observable } from 'rxjs/Observable';
import { Request, ReplyWithContinue } from 'hapi';
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
    static routeLifecycle(main: MainModule) {

        main.server.ext(LifecycleEventsEnum.OnPreAuth, (request, reply) => {
            const route = this.findRoute(main, request.route.method, request.route.path);
            if (route && route.token) {
                const reqInfo = new HttpRequestInfo(request.id);
                route.providers = route.providers.concat({ provide: HttpRequestInfo, useValue: reqInfo });
                request['_hapinessRoute'] = RouteBuilder.instantiateRouteAndDI(route);
                this.eventHandler(LifecycleHooksEnum.OnPreAuth, main, request, reply);
            } else {
                reply.continue();
            }
        });

        main.server.ext(LifecycleEventsEnum.OnPostAuth,
            (request, reply) => this.eventHandler(LifecycleHooksEnum.OnPostAuth, main, request, reply));

        main.server.ext(LifecycleEventsEnum.OnPreHandler,
            (request, reply) => this.eventHandler(LifecycleHooksEnum.OnPreHandler, main, request, reply));

        main.server.ext(LifecycleEventsEnum.OnPostHandler,
            (request, reply) => this.eventHandler(LifecycleHooksEnum.OnPostHandler, main, request, reply));

        main.server.ext(LifecycleEventsEnum.OnPreResponse,
            (request, reply) => this.eventHandler(LifecycleHooksEnum.OnPreResponse, main, request, reply));
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
    private static eventHandler(hook: LifecycleHooksEnum, mainModule: MainModule, request, reply) {
        const route = this.findRoute(mainModule, request.route.method, request.route.path);
        if (request['_hapinessRoute'] && HookManager.hasLifecycleHook(hook.toString(), route.token)) {
            HookManager.triggerHook(hook.toString(), route.token, request['_hapinessRoute'], [request, reply]);
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
