import { ExtensionWithConfig } from '../../core';
import { Extension, OnExtensionLoad, OnModuleInstantiated } from '../../core/bootstrap';
import { DependencyInjection } from '../../core/di';
import { HookManager } from '../../core/hook';
import { CoreModule, ModuleLevel, ModuleManager } from '../../core/module';
import { Observable } from 'rxjs/Observable';
import { server, connection, request } from 'websocket';
import { Socket } from './socket';
import * as http from 'http';
import * as Boom from 'boom';
import * as Hoek from 'hoek';
import * as Debug from 'debug';
const debug = Debug('hapiness:extension:socketserver');

export interface SocketConfig {
    port: number;
}

export class SocketServer implements OnExtensionLoad {

    private server: server;
    private subscribers: Array<(socket: Socket) => void>;
    private sockets: Socket[];

    public static setConfig(config: SocketConfig): ExtensionWithConfig {
        return {
            token: SocketServer,
            config
        };
    }

    /**
     * Initilization of the extension
     * Create the socket server
     *
     * @param  {CoreModule} module
     * @param  {SocketConfig} config
     * @returns Observable
     */
    onExtensionLoad(module: CoreModule, config: SocketConfig): Observable<Extension> {
        debug('server instantiation');
        const httpServer = http.createServer((request, response) => {
            response.writeHead(404);
            response.end();
        });
        httpServer.listen(config.port);
        this.server = new server({
            httpServer,
            autoAcceptConnections: false
        });
        this.sockets = [];
        this.subscribers = [];
        /* istanbul ignore next */
        this.server.on('request', this.onRequestHandler);
        return Observable.create(observer => {
            observer.next({
                instance: this,
                token: SocketServer,
                value: this
            });
            observer.complete();
        })
    }

    /**
     * Resquest handler
     * Accept the request
     *
     * @param  {request} request
     */
    private onRequestHandler(request: request) {
        const connection = request.accept(null, request.origin);
        const socket = new Socket(request, connection);
        const index = this.sockets.push(socket) - 1;
        this.subscribers.forEach(sub => sub.apply(this, [ socket ]));
        connection.on('close', conn => {
            this.sockets.splice(index, 1);
        });
    }

    /**
     * Subscribe to new socket connections
     *
     * @param  {(socket:Socket)=>void} callback
     */
    public onRequest(callback: (socket: Socket) => void) {
        this.subscribers.push(callback);
    }

    /**
     * Get active sockets
     *
     * @returns Socket
     */
    public getSockets(): Socket[] {
        return this.sockets;
    }

    /**
     * Broadcast data into active sockets
     *
     * @param  {string} event
     * @param  {any} data
     */
    public broadcast(event: string, data: any) {
        this.server.broadcastUTF(JSON.stringify({
            type: event,
            data
        }));
    }
}
