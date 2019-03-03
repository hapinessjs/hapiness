import { Extension, ExtensionResult, ExtensionConfig } from '../../core/extensions';
import * as Fastify from 'fastify';
import { ServerOptions } from 'https';
import { CoreModule, CoreDecorator } from '../../core';
import { Observable, of, from } from 'rxjs';
import { map, filter, toArray, mapTo } from 'rxjs/operators';
import { metadataToCoreRoute, CoreRoute } from './route';

export interface HttpServerConfig extends ExtensionConfig {
    https?: ServerOptions,
    ignoreTrailingSlash?: Fastify.ServerOptions['ignoreTrailingSlash'],
    maxParamLength?: Fastify.ServerOptions['maxParamLength'],
    bodyLimit?: Fastify.ServerOptions['bodyLimit'],
}

export type ServerHTTP = Fastify.FastifyInstance;

export class HttpServer extends Extension<ServerHTTP> {

    decorators = [ 'Route' ]

    onLoad(): Observable<ExtensionResult<ServerHTTP>> {
        return of(this.loadedResult(Fastify()));
    }

    onBuild(module: CoreModule, decorators: CoreDecorator<any>[]) {
        return this.buildRoutes(decorators, module).pipe(mapTo(null));
    }

    onShutdown() {
        return Observable.create(observer => {
            this.value.close(() => {
                observer.complete();
            });
        });
    }

    private buildRoutes(decorators: CoreDecorator<any>[], module: CoreModule): Observable<CoreRoute[]> {
        return from(decorators).pipe(
            map(decorator => ({ decorator, ...Extension.extractMetadata(decorator)})),
            filter(data => data.name === 'Route'),
            map(data => metadataToCoreRoute(data.metadata, module, data.decorator)),
            toArray()
        )
    }
}
