import { createDecorator, CoreDecorator, Type } from '../../core/decorators';
import { RouteConfig } from './route';

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
