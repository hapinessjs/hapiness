import { CoreDecorator, Type } from '../../core/decorators';
import { Extension } from '../../core/extensions';

export interface Route {
    path: string;
    method: string | string[];
    version?: string;
    schema?: {
        body: any;
        querystring: any;
        params: any;
        response: any;
    };
    bodyLimit?: number;
    providers?: Array<Type<any>|any>;
}
export const Route: CoreDecorator<Route> = Extension.createDecorator<Route>('Route', {
    path: undefined,
    method: undefined,
    version: undefined,
    schema: undefined,
    bodyLimit: undefined,
    providers: undefined
});
