import { CoreModule, CoreProvide } from '../../core/interfaces';
import { Type } from '../../core/decorators';
import { Request, ReplyWithContinue, ReplyNoContinue, ServerOptions } from 'hapi';
import { Observable } from 'rxjs';

export interface HapiConfig {
    host: string;
    port: number;
    options?: ServerOptions
}

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
    payload?: any;
    plugins?: any;
    pre?: any;
    response?: any;
    security?: any;
    state?: any;
    timeout?: any;
}

/**
 * CoreRoute Type
 * Represents an Http Route
 */
export interface CoreRoute {
    token: Type<any> | any;
    path: string;
    method: string | string[];
    module: CoreModule;
    providers?: CoreProvide[];
    config?: RouteConfig;
}

export interface HapinessHTTPHandlerResponse {
    response: any;
    statusCode: number;
}

/**
 * Route Handler
 * called on Http Get request
 *
 * @returns void | Observable
 */
export interface OnGet {
    onGet(request: Request, reply?: ReplyNoContinue): void | Observable<any | HapinessHTTPHandlerResponse>;
}

/**
 * Route Handler
 * called on Http Post request
 *
 * @returns void | Observable
 */
export interface OnPost {
    onPost(request: Request, reply?: ReplyNoContinue): void | Observable<any | HapinessHTTPHandlerResponse>;
}

/**
 * Route Handler
 * called on Http Put request
 *
 * @param  {Error} error
 * @returns void | Observable
 */
export interface OnPut {
    onPut(request: Request, reply?: ReplyNoContinue): void | Observable<any | HapinessHTTPHandlerResponse>;
}

/**
 * Route Handler
 * called on Http Patch request
 *
 * @param  {string} module
 * @returns void | Observable
 */
export interface OnPatch {
    onPatch(request: Request, reply?: ReplyNoContinue): void | Observable<any | HapinessHTTPHandlerResponse>;
}

/**
 * Route Handler
 * called on Http Options request
 *
 * @param  {string} module
 * @returns void | Observable
 */
export interface OnOptions {
    onOptions(request: Request, reply?: ReplyNoContinue): void | Observable<any | HapinessHTTPHandlerResponse>;
}

/**
 * Route Handler
 * called on Http Delete request
 *
 * @param  {string} module
 * @returns void | Observable
 */
export interface OnDelete {
    onDelete(request: Request, reply?: ReplyNoContinue): void | Observable<any | HapinessHTTPHandlerResponse>;
}

/**
 * OnPreAuth Lifecycle hook
 *
 * @param  {Request} request
 * @param  {Reply} reply
 * @returns void | Observable
 */
export interface OnPreAuth {
    onPreAuth(request: Request, reply?: ReplyWithContinue ): void | Observable<void>;
}

/**
 * OnPostAuth Lifecycle hook
 *
 * @param  {Request} request
 * @param  {Reply} reply
 * @returns void | Observable
 */
export interface OnPostAuth {
    onPostAuth(request: Request, reply?: ReplyWithContinue ): void | Observable<void>;
}

/**
 * OnPreHandler Lifecycle hook
 *
 * @param  {Request} request
 * @param  {Reply} reply
 * @returns void | Observable
 */
export interface OnPreHandler {
    onPreHandler(request: Request, reply?: ReplyWithContinue ): void | Observable<void>;
}

/**
 * OnPostHandler Lifecycle hook
 *
 * @param  {Request} request
 * @param  {Reply} reply
 * @returns void | Observable
 */
export interface OnPostHandler {
    onPostHandler(request: Request, reply?: ReplyWithContinue ): void | Observable<void>;
}

/**
 * OnPreResponse Lifecycle hook
 *
 * @param  {Request} request
 * @param  {Reply} reply
 * @returns void | Observable
 */
export interface OnPreResponse {
    onPreResponse(request: Request, reply?: ReplyWithContinue ): void | Observable<void>;
}

/**
 * Request lifecycle component Hook
 *
 * @returns void | Observable
 */
export interface OnEvent { onEvent(request: Request, reply: ReplyWithContinue): void | Observable<void>; }
