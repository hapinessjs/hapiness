import { Type, CoreModule, MetadataAndName, DependencyInjection, HookManager, errorHandler, ModuleLevel } from '../core';
import { Route, Get, Methods } from './decorators';
import { Observable, from, of } from 'rxjs';
import { map, toArray, tap, flatMap, mapTo, filter } from 'rxjs/operators';
import { FastifyServer, HttpServerRequest, HttpServer } from './extension';
import { Extension } from '../core/extensions';
import { IncomingMessage } from 'http';
import { isTSchema, serializer } from '@juneil/tschema';
import * as Fastify from 'fastify';
import { arr } from '../core/utils';

export interface CoreRoute extends Route {
    token: Type<any>;
    module: CoreModule;
}

export interface HttpResponse<T> {
    value: T;
    status?: number;
    headers?: { [key: string]: string };
    redirect?: boolean;
}

export function buildRoutes(decorators: MetadataAndName<Route>[], server: FastifyServer): Observable<void> {
    return from(decorators).pipe(
        map(data => toCoreRoute(data.metadata, data.token, data.source)),
        toArray(),
        map(routes => organizeRoutes(routes)),
        tap(routes => buildPlugin(routes, server)),
        mapTo(null)
    );
}

function buildPlugin(routes: Organized[], server: FastifyServer) {
    server.register(function (instance, opts, next) {
        from(routes).pipe(
            flatMap(route => {
                if (route.module.level === ModuleLevel.ROOT) {
                    return from(route.routes).pipe(
                        flatMap(_route => addRoute(_route, instance)),
                        toArray()
                    );
                } else {
                    const prefix = route.module.prefix === true ?
                        route.module.name.toLowerCase() :
                        !!route.module.prefix ?
                            route.module.prefix.toString() :
                            undefined;
                    instance.register(function(_instance, _opts, _next) {
                        from(route.routes).pipe(
                            flatMap(_route => addRoute(_route, _instance)),
                            toArray()
                        ).subscribe(null, null, () => _next());
                    }, { prefix });
                    return of(null);
                }
            })
        ).subscribe(null, null, () => next());
    });
}

function toCoreRoute(route: Route, token: Type<any>, module: CoreModule): CoreRoute {
    return Object.assign({
        token,
        module
    }, route);
}

function schema(meta: MetadataAndName<Methods>): { [k: string]: Type<any> } {
    const schemaValue = {} as any;
    if (meta.metadata.query && isTSchema(meta.metadata.query)) { schemaValue.querystring = serializer(meta.metadata.query); }
    if (meta.metadata.params && isTSchema(meta.metadata.params)) { schemaValue.params = serializer(meta.metadata.params); }
    if (meta.metadata.headers && isTSchema(meta.metadata.headers)) { schemaValue.headers = serializer(meta.metadata.headers); }
    if (meta.metadata.payload && isTSchema(meta.metadata.payload)) { schemaValue.body = serializer(meta.metadata.payload); }
    if (meta.metadata.response) {
        schemaValue.response = {};
        Object.keys(meta.metadata.response)
            .filter(key => isTSchema(meta.metadata.response[key]))
            .forEach(key => schemaValue.response[key] = serializer(meta.metadata.response[key]));
    }
    return schemaValue;
}

function addRoute(route: CoreRoute, server: FastifyServer) {
    return from(Object.getOwnPropertyNames(route.token.prototype)).pipe(
        map(property => Extension.extractMetadata<Methods>(route.module, route.token, property)),
        filter(meta => !!meta),
        tap(meta => server.route({
            method: getMethod(meta.name),
            url: route.path,
            handler: handler(route, meta),
            schema: schema(meta),
            config: route
        })),
        toArray(),
        mapTo(route)
    );
}

function getMethod(name: string): Fastify.HTTPMethod {
    switch (name) {
        case 'Get': return 'GET';
        case 'Post': return 'POST';
        case 'Put': return 'PUT';
        case 'Delete': return 'DELETE';
        case 'Patch': return 'PATCH';
        case 'Head': return 'HEAD';
        case 'Options': return 'OPTIONS';
        default: return 'GET';
    }
}

function handleResponse<T>(response: T | HttpResponse<T>): HttpResponse<T> {
    if (!!response && typeof response === 'object') {
        return {
            status: (response as HttpResponse<T>).status || 200,
            headers: (response as HttpResponse<T>).headers || {},
            redirect: (response as HttpResponse<T>).redirect || false,
            value: (response as HttpResponse<T>).value || response as T
        };
    } else {
        return {
            status: !!response ? 200 : 204,
            headers: {},
            redirect: false,
            value: response as T
        };
    }
}

function populateTSchema(key: string, param: any, request: Fastify.FastifyRequest<IncomingMessage>) {
    let data;
    if (key === 'query') { data = request['query']; }
    if (key === 'params') { data = request['params']; }
    if (key === 'headers') { data = request['headers']; }
    if (key === 'payload') { data = request['body']; }
    if (!data) {
        return;
    }
    // TODO ONLY SET PROPERTIES DEFINED !!!!!!!!!
    const instance = Reflect.construct(param, []);
    Object.keys(data).forEach(prop => Reflect.set(instance, prop, data[prop]));
    return instance;
}

function resolveHandlerDI(request: Fastify.FastifyRequest<IncomingMessage>, metadataAndName: MetadataAndName<Methods>): any[] {
    return arr(metadataAndName.metadata['paramtypes'])
        .map(param => Object.keys(metadataAndName.metadata)
            .filter(key => metadataAndName.metadata[key] === param && isTSchema(param as any))
            .map(key => populateTSchema(key, param, request))
            .pop() || (param === HttpServerRequest ? request : undefined)
        );
}

function handler(route: CoreRoute, metadataAndName: MetadataAndName<Methods>) {
    return (request: Fastify.FastifyRequest<IncomingMessage>, reply: Fastify.FastifyReply<any>) => {
        DependencyInjection.instantiateComponent(route.token, request['_hapiness'].di).pipe(
            flatMap(instance => of(resolveHandlerDI(request, metadataAndName)).pipe(
                flatMap(args => HookManager.triggerHook(metadataAndName.property, route.token, instance, args))
            )),
            map(response => handleResponse(response)),
            tap(response => {
                reply
                    .code(response.status)
                    .headers(response.headers);
                if (response.redirect) {
                    return reply.redirect(response.value as string);
                }
                reply.send(response.value);
            })
        ).subscribe(
            () => null,
            error => {
                errorHandler(error);
                reply.send(error);
            }
        );
    };
}

type Organized = { module: CoreModule, routes: CoreRoute[] };
function organizeRoutes(routes: CoreRoute[]): Organized[] {
    const result = [];
    routes.forEach(route => {
        const item = result.find(r => r.module.name === route.module.name);
        if (item) {
            item.routes.push(route);
        } else {
            result.push({ module: route.module, routes: [ route ] });
        }
    });
    return result.sort((a, b) => a.module.level - b.module.level);
}