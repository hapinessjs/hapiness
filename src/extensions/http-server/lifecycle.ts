import { Observable } from 'rxjs';
import { HookManager } from '../../core/hook';
import { LifecycleEventsEnum, LifecycleHooksEnum } from './enums';
import { RouteBuilder } from './route';
import { CoreRoute } from './interfaces';
import { errorHandler } from '../../core/hapiness';
import { Request, ReplyWithContinue, Server } from 'hapi';

export class LifecycleManager {

    /**
     * Initialize the lifecycle hooks
     * for a route
     *
     * @param  {MainModule} main
     */
    static routeLifecycle(server: Server, routes: CoreRoute[]): void {

        server.ext(<any>LifecycleEventsEnum.OnPreAuth.toString(),
        (request: Request, reply: ReplyWithContinue) =>
            this.eventHandler(LifecycleHooksEnum.OnPreAuth, routes, request, reply)
                .subscribe(
                    _ => reply.continue(),
                    _ => errorHandler(_)
                )
        );

        server.ext(<any>LifecycleEventsEnum.OnPostAuth.toString(),
            (request: Request, reply: ReplyWithContinue) =>
                this.instantiateRoute(routes, request, reply)
                    .subscribe(
                        _ => reply.continue(),
                        _ => errorHandler(_)
                    )
        );

        server.ext(<any>LifecycleEventsEnum.OnPreHandler.toString(),
            (request: Request, reply: ReplyWithContinue) =>
                this.eventHandler(LifecycleHooksEnum.OnPreHandler, routes, request, reply)
                    .subscribe(
                        _ => reply.continue(),
                        _ => errorHandler(_)
                    )
        );

        server.ext(<any>LifecycleEventsEnum.OnPostHandler.toString(),
            (request: Request, reply: ReplyWithContinue) =>
                this.eventHandler(LifecycleHooksEnum.OnPostHandler, routes, request, reply)
                    .subscribe(
                        _ => reply.continue(),
                        _ => errorHandler(_)
                    )
        );

        server.ext(<any>LifecycleEventsEnum.OnPreResponse.toString(),
            (request: Request, reply: ReplyWithContinue) =>
                this.eventHandler(LifecycleHooksEnum.OnPreResponse, routes, request, reply)
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
            .flatMap(route =>
                RouteBuilder
                    .instantiateRouteAndDI(route, request)
                    .map(_ => ({ route, instance: _ }))
            )
            .do(_ => request['_hapinessRoute'] = _.instance)
            .defaultIfEmpty(null)
            .flatMap(_ => this.eventHandler(LifecycleHooksEnum.OnPostAuth, routes, request, reply))
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
        const labels = this.arrayify(request.connection.settings.labels);
        return routes
            .find(r => ((r.method === request.route.method || r.method.indexOf(request.route.method) > -1) &&
                (this.isRightLabels(labels, this.arrayify(r.labels))) &&
                r.path === request.route.path));
    }

    /**
     * Make sure to match the right route
     * with the labels
     *
     * @param  {string[]=[]} labels
     * @param  {string[]=[]} routeLabels
     * @returns boolean
     */
    private static isRightLabels(labels: string[] = [], routeLabels: string[] = []): boolean {
        if (labels.length === 0 || routeLabels.length === 0) {
            return true;
        } else {
            return routeLabels.some(_ => labels.indexOf(_) > -1);
        }
    }

    private static arrayify(data: any): any[] {
        return [].concat(data).filter(_ => !!_);
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
                    .defaultIfEmpty(null)
            )
            .isEmpty()
            .filter(_ => !!_);
    }

}
