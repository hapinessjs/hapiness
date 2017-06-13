import { createDecorator, CoreDecorator, Type } from '../../core/decorators';

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

export interface Route {
    path: string;
    method: string | string[];
    config?: RouteConfig;
    providers?: Array<Type<any>|any>;
}
export const Route = createDecorator<Route>('Route', {
    path: undefined,
    method: undefined,
    config: undefined,
    providers: undefined
});


export interface Lifecycle {
    event: string;
}
export const Lifecycle = createDecorator<Lifecycle>('Lifecycle', {
    event: undefined
});
