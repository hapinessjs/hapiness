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

    constructor(config: SocketConfig) {
        const httpServer = http.createServer((request, response) => {
            /* istanbul ignore next */
            response.writeHead(404);
            /* istanbul ignore next */
            response.end();
        });
        httpServer.listen(config.port);
        delete config.port;
        const _config = Object.assign({ httpServer }, config);
        this.server = new server(_config);
        this.sockets = [];
        this.subscribers = [];
        this.server.on('request', request => {
            this.onRequestHandler(request);
        });
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
            event,
            data
        }));
    }
}
