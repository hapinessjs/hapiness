import { Type, CoreModule, MetadataAndName, DependencyInjection, ModuleManager, HookManager, errorHandler } from '../core';
import { Route, Get, Methods } from './decorators';
import { Observable, from, of } from 'rxjs';
import { map, toArray, tap, flatMap, mapTo, filter } from 'rxjs/operators';
import { FastifyServer, HttpServerRequest } from './extension';
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

export function buildRoutes(module: CoreModule, decorators: MetadataAndName<Route>[], server: FastifyServer): Observable<CoreRoute[]> {
    return from(decorators).pipe(
        map(data => toCoreRoute(data.metadata, module, data.token)),
        flatMap(route => addRoute(module, route, server)),
        toArray()
    );
}

function toCoreRoute(route: Route, module: CoreModule, token: Type<any>): CoreRoute {
    return Object.assign({
        token,
        module
    }, route);
}

function addRoute(module: CoreModule, route: CoreRoute, server: FastifyServer) {
    return from(Object.getOwnPropertyNames(route.token.prototype)).pipe(
        map(property => Extension.extractMetadata<Methods>(route.token, property)),
        filter(meta => !!meta),
        tap(meta => server.route({
            method: getMethod(meta.name),
            url: route.path,
            handler: handler(module, route, meta),
            schema: {
                querystring: isTSchema(meta.metadata.query) ? serializer(meta.metadata.query) : undefined
            }
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
    let data = {};
    switch (key) {
        case 'query':
            data = request.query;
            break;
    }
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

function handler(module: CoreModule, route: CoreRoute, metadataAndName: MetadataAndName<Methods>) {
    return (request: Fastify.FastifyRequest<IncomingMessage>, reply: Fastify.FastifyReply<any>) => {
        DependencyInjection.createAndResolve([], module.di).pipe(
            flatMap(di => DependencyInjection.instantiateComponent(route.token, di)),
            flatMap(instance => of(resolveHandlerDI(request, metadataAndName)).pipe(
                flatMap(args => HookManager.triggerHook(metadataAndName.property, route.token, instance, args))
            )),
            map(response => handleResponse(response))
        ).subscribe(
            response => {
                reply
                    .code(response.status)
                    .headers(response.headers);
                if (response.redirect) {
                    return reply.redirect(response.value as string);
                }
                reply.send(response.value);
            },
            error => {
                errorHandler(error);
                reply.send(error);
            }
        );
    };
}
