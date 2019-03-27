import { Observable, of, from } from 'rxjs';
import { FastifyServer, HttpServerRequest } from './extension';
import { MetadataAndName, DependencyInjection, Extension, HookManager } from '../core';
import { Lifecycle, Hook, Hooks } from './decorators';
import { map, filter, toArray, flatMap, tap, mapTo, ignoreElements, defaultIfEmpty } from 'rxjs/operators';
import { ReflectiveInjector } from 'injection-js';
import { arr } from '../core/utils';

const hooksMap = new Map<Hooks, string>();
hooksMap.set('request', 'onRequest');
hooksMap.set('pre_validation', 'preValidation');
hooksMap.set('pre_handler', 'preHandler');
hooksMap.set('response', 'onResponse');


export function buildLifecycleComponents(decorators: MetadataAndName<Lifecycle>[], server: FastifyServer): Observable<void> {

    server.addHook('onRequest', (request, reply, next) => {
        const di = ((reply.context.config || {}).module || {}).di;
        if (di) {
            DependencyInjection.createAndResolve([{ provide: HttpServerRequest, useValue: request }], di).subscribe(
                newDI => {
                    request['_hapiness'] = { di: newDI };
                    next();
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
        instantiate(hook, request['_hapiness'].di).subscribe(
            () => next(),
            err => next(err)
        );
    });
}

function extractPropertiesMetadata(metadata: MetadataAndName<Lifecycle>): Observable<MetadataAndName<Hook>[]> {
    return from(Object.getOwnPropertyNames(metadata.token.prototype)).pipe(
        map(property => Extension.extractMetadata<Hook>(metadata.source, metadata.token, property)),
        filter(Boolean),
        toArray()
    );
}

function instantiate(hook: MetadataAndName<Hook>, di: ReflectiveInjector) {
    return DependencyInjection.instantiateComponent(hook.token, di).pipe(
        flatMap(instance => HookManager.triggerHook(hook.property, hook.token, instance))
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
