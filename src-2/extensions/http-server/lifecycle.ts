import { Observable } from 'rxjs';
import { HookManager } from '../../core/hook';
import { LifecycleEventsEnum, LifecycleHooksEnum } from './enums';
import { RouteBuilder } from './route';
import { CoreRoute } from './interfaces';
import { errorHandler } from '../../core/hapiness';
import { Request, ReplyWithContinue, Server } from 'hapi';

export class LifecycleManager {

    private static eventName = 'onEvent';

    /**
     * Initialize the lifecycle hooks
     * for a route
     *
     * @param  {MainModule} main
     */
    static routeLifecycle(server: Server, routes: CoreRoute[]): void {

        server.ext(<any>LifecycleEventsEnum.OnPreAuth.toString(),
            (request: Request, reply: ReplyWithContinue) =>
                this.instantiateRoute(routes, request, reply)
                    .subscribe(
                        _ => reply.continue(),
                        _ => errorHandler(_)
                    )
        );

        server.ext(<any>LifecycleEventsEnum.OnPostAuth.toString(),
            (request: Request, reply: ReplyWithContinue) =>
                this.eventHandler(LifecycleHooksEnum.OnPostAuth, routes, request, reply)
                    .subscribe(
                        _ => reply.continue(),
                        _ => errorHandler(_)
                    )
        );

        server.ext(<any>LifecycleEventsEnum.OnPreHandler.toString(),
            (request: Request, reply: ReplyWithContinue) =>
                this.eventHandler(LifecycleHooksEnum.OnPostAuth, routes, request, reply)
                    .subscribe(
                        _ => reply.continue(),
                        _ => errorHandler(_)
                    )
        );

        server.ext(<any>LifecycleEventsEnum.OnPostHandler.toString(),
            (request: Request, reply: ReplyWithContinue) =>
                this.eventHandler(LifecycleHooksEnum.OnPostAuth, routes, request, reply)
                    .subscribe(
                        _ => reply.continue(),
                        _ => errorHandler(_)
                    )
        );

        server.ext(<any>LifecycleEventsEnum.OnPostHandler.toString(),
            (request: Request, reply: ReplyWithContinue) =>
                this.eventHandler(LifecycleHooksEnum.OnPostAuth, routes, request, reply)
                    .subscribe(
                        _ => reply.continue(),
                        _ => errorHandler(_),
                        () => request['_hapinessRoute'] = undefined
                    )
        );
    }

    /**
     * Instantiate the route matching the request
     * And trigger OnPreAuth hook
     *
     * @param  {CoreRoute[]} routes
     * @param  {Request} request
     * @param  {ReplyWithContinue} reply
     * @returns Observable
     */
    private static instantiateRoute(routes: CoreRoute[], request: Request, reply: ReplyWithContinue): Observable<any> {
        return Observable
            .of(routes)
            .map(_ => this.findRoute(request, _))
            .filter(_ => !!(_ && _.token))
            .flatMap(_ => RouteBuilder.instantiateRouteAndDI(_, request))
            .do(_ => request['_hapinessRoute'] = _)
            .flatMap(_ => this.eventHandler(LifecycleHooksEnum.OnPreAuth, routes, request, reply))
    }

    /**
     * Find the matching route with
     * path and method
     *
     * @param  {Request} request
     * @param  {CoreRoute[]} routes
     * @returns CoreRoute
     */
    private static findRoute(request: Request, routes: CoreRoute[]): CoreRoute {
        return routes
            .find(r => ((r.method === request.route.method || r.method.indexOf(request.route.method) > -1) &&
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
    private static eventHandler(hook: LifecycleHooksEnum, routes: CoreRoute[],
            request: Request, reply: ReplyWithContinue): Observable<any> {

        return Observable
            .of(routes)
            .map(_ => this.findRoute(request, _))
            .filter(_ => request['_hapinessRoute'] && HookManager.hasLifecycleHook(hook.toString(), _.token))
            .flatMap(_ =>
                HookManager
                    .triggerHook(hook.toString(), _.token, request['_hapinessRoute'], [request, reply])
            )
            .defaultIfEmpty(reply.continue())
            .filter(_ => !!_ && !_.statusCode && !_.headers && !_.source);
    }

}
