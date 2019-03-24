import { Extension } from '../core/extensions';
import { Type } from '../core/decorators';

export interface Route {
    path?: string;
    version?: string;
    bodyLimit?: number;
    providers?: Array<Type<any> | any>;
}
export const Route = Extension.createDecorator<Route>('Route', {
    path: undefined,
    version: undefined,
    bodyLimit: undefined,
    providers: undefined
});

export interface Lifecycle {
    event: string;
}
export const Lifecycle = Extension.createDecorator<Lifecycle>('Lifecycle', {
    event: undefined
});

interface RouteHandler {
    query?: Type<any>;
    params?: Type<any>;
    headers?: Type<any>;
}

export interface Get extends RouteHandler {}
export const Get = Extension.createPropDecorator<Get>('Get', {
    query: undefined,
    params: undefined,
    headers: undefined
});

export interface Delete extends RouteHandler {}
export const Delete = Extension.createPropDecorator<Delete>('Delete', {
    query: undefined,
    params: undefined,
    headers: undefined
});

export interface Head extends RouteHandler {}
export const Head = Extension.createPropDecorator<Head>('Head', {
    query: undefined,
    params: undefined,
    headers: undefined
});

export interface Options extends RouteHandler {}
export const Options = Extension.createPropDecorator<Options>('Options', {
    query: undefined,
    params: undefined,
    headers: undefined
});

export interface Post extends RouteHandler {
    payload?: Type<any>;
}
export const Post = Extension.createPropDecorator<Post>('Post', {
    query: undefined,
    params: undefined,
    headers: undefined,
    payload: undefined
});

export interface Put extends RouteHandler {
    payload?: Type<any>;
}
export const Put = Extension.createPropDecorator<Put>('Put', {
    query: undefined,
    params: undefined,
    headers: undefined,
    payload: undefined
});

export interface Patch extends RouteHandler {
    payload?: Type<any>;
}
export const Patch = Extension.createPropDecorator<Patch>('Patch', {
    query: undefined,
    params: undefined,
    headers: undefined,
    payload: undefined
});

export type Methods = Get & Post & Put & Patch & Delete & Head & Options;
