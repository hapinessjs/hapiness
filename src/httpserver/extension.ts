import { Extension, ExtensionResult, ExtensionConfig } from '../core/extensions';
import * as Fastify from 'fastify';
import { ServerOptions } from 'https';
import { CoreModule, ExtensionShutdownPriority, MetadataAndName } from '..';
import { Observable, from } from 'rxjs';
import { mapTo, tap, flatMap, toArray, filter } from 'rxjs/operators';
import { buildRoutes } from './route';
import { IncomingMessage } from 'http';
import { buildLifecycleComponents } from './lifecycle';

export interface HttpServerConfig extends ExtensionConfig {
    https?: ServerOptions;
    ignoreTrailingSlash?: Fastify.ServerOptions['ignoreTrailingSlash'];
    maxParamLength?: Fastify.ServerOptions['maxParamLength'];
    bodyLimit?: Fastify.ServerOptions['bodyLimit'];
}

export type FastifyServer = Fastify.FastifyInstance;
export class HttpServerRequest<A = any> {
    auth?: A;
    query: { [k: string]: any };
    params: { [k: string]: any };
    headers: { [k: string]: any };
    body: { [k: string]: any };
    id: any;
    ip: string;
    hostname: string;
    raw: IncomingMessage;
    req: IncomingMessage;
}

export class HttpServer extends Extension<FastifyServer, HttpServerConfig> {

    decorators = [ 'Route', 'Lifecycle' ];

    private defaultHost = '0.0.0.0';
    private defaultPort = 8080;

    /**
     * Load the Extension with a instance of Fastify
     */
    onLoad(): Observable<ExtensionResult<FastifyServer>> {
        return this.setValue(Fastify());
    }

    /**
     * Build Route & Lifecycle decorators
     * @param _
     * @param decorators
     */
    onBuild(_: CoreModule, decorators: MetadataAndName<any>[]) {
        return from(decorators).pipe(
            filter(decorator => decorator.name === 'Route'),
            toArray(),
            flatMap(routeDecorators => buildRoutes(routeDecorators, this.value)),
            flatMap(() => from(decorators).pipe(
                filter(decorator => decorator.name === 'Lifecycle'),
                toArray()
            )),
            flatMap(lifecycleDecorators => buildLifecycleComponents(lifecycleDecorators, this.value)),
            flatMap(() => this.value.listen(this.config.port || this.defaultPort, this.config.host || this.defaultHost)),
            tap(info => this.logger.info(`server running at ${info}`)),
            mapTo(null)
        );
    }

    /**
     * Graceful shutdown
     */
    onShutdown() {
        return {
            resolver: this.close(),
            priority: ExtensionShutdownPriority.IMPORTANT
        };
    }

    private close(): Observable<void> {
        return Observable.create(observer => {
            this.value.close(() => observer.complete());
        });
    }
}
