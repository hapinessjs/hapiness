import { HookManager } from '../../core/hook';
import { CoreModule, ModuleLevel, ModuleManager } from '../../core/module';
import { Observable } from 'rxjs/Observable';
import { server, connection, request } from 'websocket';
import { Socket } from './socket';
import { SocketConfig } from './extension';
import * as http from 'http';
import * as Debug from 'debug';
const debug = Debug('hapiness:extension:socketserver');

export class WebSocketServer {

    private server: server;
    private subscribers: Array<(socket: Socket) => void>;
    private sockets: Socket[];

    constructor(module: CoreModule, config: SocketConfig) {
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