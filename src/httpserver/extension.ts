import { Extension, ExtensionResult, ExtensionConfig } from '../core/extensions';
import * as Fastify from 'fastify';
import * as FastifyCors from 'fastify-cors';
import * as FastifyWebsocket from 'fastify-websocket';
import { ServerOptions } from 'https';
import { CoreModule, ExtensionShutdownPriority, MetadataAndName } from '..';
import { Observable, from } from 'rxjs';
import { mapTo, tap, flatMap, toArray, filter } from 'rxjs/operators';
import { buildRoutes } from './route';
import { IncomingMessage } from 'http';
import { buildLifecycleComponents } from './lifecycle';
import { WebsocketManager } from './wsmanager';

export interface HttpServerConfig extends ExtensionConfig {
    websocket?: boolean;
    https?: ServerOptions;
    ignoreTrailingSlash?: Fastify.ServerOptions['ignoreTrailingSlash'];
    maxParamLength?: Fastify.ServerOptions['maxParamLength'];
    bodyLimit?: Fastify.ServerOptions['bodyLimit'];
    cors?: {
        origin?: string | boolean | RegExp | string[] | RegExp[];
        credentials?: boolean;
        exposedHeaders?: string | string[];
        allowedHeaders?: string | string[];
        methods?: string | string[];
        maxAge?: number;
        preflightContinue?: boolean;
        optionsSuccessStatus?: number;
        preflight?: boolean;
    };
}
type AnyObject = {[key: string]: any};
type WebsocketHandler = { wsHandler?: WebsocketManager };
export type FastifyServer = Fastify.FastifyInstance & WebsocketHandler;
export class HttpServerRequest<A = AnyObject, E = AnyObject> {
    auth?: A;
    query: AnyObject;
    params: AnyObject;
    headers: AnyObject;
    body: AnyObject;
    id: any;
    ip: string;
    hostname: string;
    raw: IncomingMessage;
    req: IncomingMessage;
    extras?: E;
}

export class HttpServer extends Extension<FastifyServer, HttpServerConfig> {

    decorators = [ 'Route', 'Lifecycle' ];

    private defaultHost = '0.0.0.0';
    private defaultPort = 8080;

    /**
     * Load the Extension with a instance of Fastify
     */
    onLoad(): Observable<ExtensionResult<FastifyServer>> {
        return this.setValue(Fastify()).pipe(
            tap(ext => {
                if (this.config.cors) {
                    ext.value.register(FastifyCors, this.config.cors);
                }
                if (this.config.websocket) {
                    ext.value.wsHandler = new WebsocketManager();
                    ext.value.register(FastifyWebsocket, {
                        handle: ext.value.wsHandler.handler.bind(ext.value.wsHandler),
                        options: {
                            maxPayload: 1048576
                        }
                    });
                }
            })
        );
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
            if (this.value.wsHandler) {
                this.value.wsHandler.close();
            }
            this.value.close(() => observer.complete());
        });
    }
}
