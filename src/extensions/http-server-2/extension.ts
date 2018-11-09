import { Extension, ExtensionValue } from '../../core/extensions';
import * as Fastify from 'fastify';
import { CoreModule } from '../../core';
import { Observable, of } from 'rxjs';
// import { flatMap, mapTo } from 'rxjs/operators';

export type ServerHTTP = Fastify.FastifyInstance;

export class HttpServer extends Extension<ServerHTTP> {

    onLoad(): Observable<ExtensionValue<ServerHTTP>> {
        return of(this.loadedResult(Fastify()));
    }

    onBuild(module: CoreModule) { return of(null); }

    onShutdown(module: CoreModule) { return of(null) }

}
