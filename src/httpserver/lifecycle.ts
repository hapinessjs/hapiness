import { Observable, from } from 'rxjs';
import { FastifyServer, HttpServerRequest } from './extension';
import { MetadataAndName, DependencyInjection, Extension, HookManager } from '..';
import { Lifecycle, Hook, Hooks } from './decorators';
import { map, filter, toArray, flatMap, tap, ignoreElements, defaultIfEmpty, take } from 'rxjs/operators';
import { ReflectiveInjector } from 'injection-js';
import { arr } from '../core/utils';
import { handleResponse, replyHttpResponse } from './route';
import { ServerResponse } from 'http';
import { errorHandler } from '../core/bootstrap';
import { extractMetadataAndName } from '../core/metadata';
import { Service } from '../core/decorators';

const hooksMap = new Map<Hooks, string>();
hooksMap.set('request', 'onRequest');
hooksMap.set('pre_validation', 'preValidation');
hooksMap.set('pre_handler', 'preHandler');
hooksMap.set('response', 'onResponse');


export function buildLifecycleComponents(decorators: MetadataAndName<Lifecycle>[], server: FastifyServer): Observable<void> {

    server.addHook('onRequest', (request, reply, next) => {
        const di = ((reply.context.config || {}).module || {}).di;
        if (di) {
            request['extras'] = reply.context.config.extras || {};
            const providers = [].concat(reply.context.config.module.all_providers,
                [{ provide: HttpServerRequest, useValue: request }])
                .filter(provider => !(extractMetadataAndName<Service>(provider.provide) || { metadata: <any>{} }).metadata.moduleOnly);
            DependencyInjection.createAndResolve(providers, di).subscribe(
                newDI => {
                    request['_hapiness'] = { di: newDI };
                    if (reply.context.config && reply.context.config.auth) {
                        findAuthenticationHandler(decorators).pipe(
                            flatMap(hook => instantiate(hook, newDI, reply.res)),
                            defaultIfEmpty()
                        ).subscribe(
                            res => {
                                if (typeof res === 'object') {
                                    request['auth'] = res;
                                }
                                next();
                            },
                            err => {
                                replyHttpResponse(handleResponse(err), reply);
                                errorHandler(err);
                            }
                        );
                    } else {
                        next();
                    }
                }
            );
        } else {
            next();
        }
    });

    return init(server, 'request', decorators).pipe(
        flatMap(() => init(server, 'pre_validation', decorators)),
        flatMap(() => init(server, 'pre_handler', decorators)),
        flatMap(() => init(server, 'response', decorators)),
        ignoreElements(),
        defaultIfEmpty(null)
    );
}

function addHook(server: FastifyServer, hook: MetadataAndName<Hook>) {
    server.addHook(hooksMap.get(hook.metadata.name) as any, (request, reply, next) => {
        const di = extractDI(request);
        if (di) {
            instantiate(hook, di, reply.res).pipe(
                take(1),
                defaultIfEmpty(null)
            ).subscribe(
                value => {
                    if (value && hook.metadata.name !== 'response') {
                        return replyHttpResponse(handleResponse(value), reply);
                    }
                    return next();
                },
                err => {
                    next(err);
                    errorHandler(err);
                }
            );
        } else {
            next();
        }
    });
}

function extractDI(request: HttpServerRequest): ReflectiveInjector {
    return (request['_hapiness'] || {}).di;
}

function extractPropertiesMetadata(metadata: MetadataAndName<Lifecycle>): Observable<MetadataAndName<Hook>[]> {
    return from(Object.getOwnPropertyNames(metadata.token.prototype)).pipe(
        map(property => Extension.extractMetadata<Hook>(metadata.token, property, metadata.source)),
        filter(_ => !!_),
        toArray()
    );
}

function instantiate(hook: MetadataAndName<Hook>, di: ReflectiveInjector, res: ServerResponse) {
    return DependencyInjection.instantiateComponent(hook.token, di).pipe(
        flatMap(instance => HookManager.triggerHook(hook.property, hook.token, instance, [res]))
    );
}

function init(server: FastifyServer, hook: Hooks, decorators: MetadataAndName<Lifecycle>[]) {
    return from(arr(decorators)).pipe(
        flatMap(decorator => extractPropertiesMetadata(decorator)),
        flatMap(hooks => from(hooks).pipe(
            filter(_hook => _hook.metadata.name === hook),
            tap(_hook => addHook(server, _hook))
        )),
        toArray()
    );
}

function findAuthenticationHandler(decorators: MetadataAndName<Lifecycle>[]) {
    return from(arr(decorators)).pipe(
        flatMap(decorator => extractPropertiesMetadata(decorator)),
        flatMap(hooks => from(hooks).pipe(
            filter(hook => hook.metadata.name === 'authentication'),
            take(1)
        ))
    );
}
