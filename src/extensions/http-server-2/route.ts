import { Route } from './decorators';
import { Type, CoreModule } from '../../core';

export interface CoreRoute extends Route {
    token: Type<any>;
    module: CoreModule;
}

export function instantiate(route: CoreRoute) {

}

export function metadataToCoreRoute(metadata: Route, module: CoreModule, token: Type<any>): CoreRoute {
    return Object.assign({
        token,
        module
    }, metadata);
}
