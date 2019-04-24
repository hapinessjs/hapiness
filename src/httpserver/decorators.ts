import 'reflect-metadata';
import { Extension } from '../core/extensions';
import { Type } from '../core/decorators';

export interface Route {
    path?: string;
    version?: string;
    bodyLimit?: number;
    providers?: Array<Type<any> | any>;
    auth?: boolean;
}
export const Route = Extension.createDecorator<Route>('Route', {
    path: undefined,
    version: undefined,
    bodyLimit: undefined,
    providers: undefined,
    auth: false
});

export interface Lifecycle {}
export const Lifecycle = Extension.createDecorator('Lifecycle', null);

interface RouteHandler {
    query?: Type<any>;
    params?: Type<any>;
    headers?: Type<any>;
    response?: {
        [code: string]: Type<any>,
        [code: number]: Type<any>
    };
}

export interface Get extends RouteHandler {}
export const Get = Extension.createPropDecorator<Get>('Get', {
    query: undefined,
    params: undefined,
    headers: undefined,
    response: undefined
});

export interface Delete extends RouteHandler {}
export const Delete = Extension.createPropDecorator<Delete>('Delete', {
    query: undefined,
    params: undefined,
    headers: undefined,
    response: undefined
});

export interface Head extends RouteHandler {}
export const Head = Extension.createPropDecorator<Head>('Head', {
    query: undefined,
    params: undefined,
    headers: undefined,
    response: undefined
});

export interface Options extends RouteHandler {}
export const Options = Extension.createPropDecorator<Options>('Options', {
    query: undefined,
    params: undefined,
    headers: undefined,
    response: undefined
});

export interface Post extends RouteHandler {
    payload?: Type<any>;
}
export const Post = Extension.createPropDecorator<Post>('Post', {
    query: undefined,
    params: undefined,
    headers: undefined,
    payload: undefined,
    response: undefined
});

export interface Put extends RouteHandler {
    payload?: Type<any>;
}
export const Put = Extension.createPropDecorator<Put>('Put', {
    query: undefined,
    params: undefined,
    headers: undefined,
    payload: undefined,
    response: undefined
});

export interface Patch extends RouteHandler {
    payload?: Type<any>;
}
export const Patch = Extension.createPropDecorator<Patch>('Patch', {
    query: undefined,
    params: undefined,
    headers: undefined,
    payload: undefined,
    response: undefined
});

export type Methods = Get & Post & Put & Patch & Delete & Head & Options;
export type Hooks = 'request' | 'pre_validation' | 'pre_handler' | 'response' | 'authentication';
export interface Hook {
    name: Hooks;
}
export const Hook = Extension.createPropDecorator<Hook>('Hook', {
    name: undefined
});
