import { ReplyWithContinue, Request, Server } from 'hapi';
import { Observable, of } from 'rxjs';
import { defaultIfEmpty, filter, flatMap, isEmpty, map, tap } from 'rxjs/operators';
import { errorHandler, HookManager } from '../../core';
import { LifecycleEventsEnum, LifecycleHooksEnum } from './enums';
import { CoreRoute } from './interfaces';
import { RouteBuilder } from './route';

export class LifecycleManager {

    /**
     * Initialize the lifecycle hooks
     * for a route
     *
     * @param  {Server} server
     * @param  {CoreRoute[]} routes
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
                        () => request[ '_hapinessRoute' ] = undefined
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
        return of(routes)
            .pipe(
                map(_ => this.findRoute(request, _)),
                filter(_ => !!(_ && _.token)),
                flatMap(route =>
                    RouteBuilder
                        .instantiateRouteAndDI(route, request)
                        .pipe(
                            map(_ => ({ route, instance: _ }))
                        )
                ),
                tap(_ => request[ '_hapinessRoute' ] = _.instance),
                defaultIfEmpty(null),
                flatMap(_ => this.eventHandler(LifecycleHooksEnum.OnPreAuth, routes, request, reply))
            );
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
     * @param  {LifecycleHooksEnum} hook
     * @param  {CoreRoute[]} routes
     * @param  {Request} request
     * @param  {ReplyWithContinue} reply
     */
    private static eventHandler(hook: LifecycleHooksEnum, routes: CoreRoute[],
                                request: Request, reply: ReplyWithContinue): Observable<any> {

        return of(routes)
            .pipe(
                map(_ => this.findRoute(request, _)),
                filter(_ => request[ '_hapinessRoute' ] && HookManager.hasLifecycleHook(hook.toString(), _.token)),
                flatMap(_ =>
                    HookManager
                        .triggerHook(hook.toString(), _.token, request[ '_hapinessRoute' ], [ request, reply ])
                        .pipe(
                            defaultIfEmpty(null)
                        )
                ),
                isEmpty(),
                filter(_ => !!_)
            );
    }

}
