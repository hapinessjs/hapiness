import * as Client from 'phin';
import * as Path from 'path';
import * as Url from 'url';
import { Observable, of, throwError } from 'rxjs';
import { Type, HTTPService, Call } from './decorators';
import { CoreProvide } from './interfaces';
import { DependencyInjection } from './di';
import { extractMetadataAndName } from './metadata';
import { flatMap, map } from 'rxjs/operators';

export interface HTTPParams<T = any> {
    query?: { [key: string]: string };
    params?: { [key: string]: string };
    headers?: { [key: string]: string };
    body?: T;
}

export interface WrapValue<R = any> {
    status: number;
    headers: { [key: string]: string };
    value: R;
}

export class HTTPError extends Error {
    statusCode: number;
}

export type CallResponse<R> = Observable<WrapValue<R>>;

export function wrap(provider: Type<any>): CoreProvide {
    return {
        provide: provider,
        useFactory: function(...args: any[]) {
            const instance = Reflect.construct(provider, args);
            const handler = { get: proxyGetHandler(instance.baseUrl) };
            return new Proxy(instance, handler);
        },
        deps: DependencyInjection.getDeps(provider)
    };
}

export function isHTTPService(provider: Type<any>): boolean {
    const httpsvc = extractMetadataAndName(provider);
    return httpsvc && httpsvc.name === 'HTTPService';
}

function buildURL(service: string, base: string, path?: string, params?: HTTPParams): string {
    if (!base) {
        throw new Error(`HTTPService[${service}] base url is missing`);
    }
    if (!base.startsWith('http')) {
        throw new Error(`HTTPService[${service}] you should specify the protocol`);
    }
    const res = Url.parse(Path.join(base, path || ''), true);
    res.query = { ...res.query, ...params.query };
    Object.entries(params.params || {})
        .forEach(([key, value]) => res.pathname = res.pathname.replace(`:${key}`, value));
    return Url.format(res);
}

function proxyGetHandler(baseUrl: string) {
    return (target: Type<any>, prop: string) => {
        const source = target[prop];
        const call = extractMetadataAndName<Call>(<any>target.constructor, prop);
        if (call.name === 'Call') {
            const svc = extractMetadataAndName<HTTPService>(<any>target.constructor);
            return (params?: HTTPParams) => of(
                buildURL(target.constructor.name, baseUrl || svc.metadata.baseUrl, call.metadata.path, params)).pipe(
                    flatMap(url => Client({
                        url,
                        method: call.metadata.method.toUpperCase(),
                        parse: 'json',
                        data: params.body,
                        headers: params.headers
                    })),
                    flatMap(res => res.statusCode >= 400 ? throwError(convertBodyToError(res)) : of(res)),
                    map(res => ({
                        value: validateResponse(res.body, call.metadata.response),
                        headers: res.headers,
                        status: res.statusCode
                    })
                )
            );
        }
        return source;
    };
}

function validateResponse<T>(data: T, schema: Type<any>): T {
    const compile = schema && schema['_compile'];
    if (!data || !compile) {
        return data;
    }
    const validate = compile.validate(data);
    if (validate) {
        return data;
    }
    throw new Error(compile.ajv.errorsText(compile.validate.errors));
}

function convertBodyToError(response: Client.JsonResponse): HTTPError {
    if (typeof response.body !== 'object') {
        response.body = { message: response.body };
    }
    const err = new HTTPError((response.body && response.body.message) || 'Internal Server Error');
    err.statusCode = response.statusCode;
    return err;
}