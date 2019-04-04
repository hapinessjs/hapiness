import * as Client from 'phin';
import * as Path from 'path';
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
            const handler = { get: proxyGetHandler };
            return new Proxy(Reflect.construct(provider, args), handler);
        },
        deps: DependencyInjection.getDeps(provider)
    };
}

export function isHTTPService(provider: Type<any>): boolean {
    const httpsvc = extractMetadataAndName(provider);
    return httpsvc && httpsvc.name === 'HTTPService';
}

function buildURL(service: string, base: string, path?: string): string {
    if (!base) {
        throw new Error(`HTTPService[${service}] base url is missing`);
    }
    if (!base.startsWith('http')) {
        throw new Error(`HTTPService[${service}] an url should start with http`);
    }
    return Path.join(base, path || '');
}

function proxyGetHandler(target: Type<any>, prop: string) {
    const source = target[prop];
    const call = extractMetadataAndName<Call>(<any>target.constructor, prop);
    if (call.name === 'Call') {
        const svc = extractMetadataAndName<HTTPService>(<any>target.constructor);
        return () => of(buildURL(target.constructor.name, svc.metadata.baseUrl, call.metadata.path)).pipe(
            flatMap(url => Client({
                url,
                method: call.metadata.method.toUpperCase(),
                parse: 'json'
            })),
            flatMap(res => res.statusCode >= 400 ? throwError(convertBodyToError(res)) : of(res.body)),
            map(res => validateResponse(res, call.metadata.response))
        );
    }
    return source;
}

function validateResponse<T>(data: T, schema: Type<any>): T {
    const compile = schema['_compile'];
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
    const err = new HTTPError(response.body.message);
    err.statusCode = response.statusCode;
    return err;
}
