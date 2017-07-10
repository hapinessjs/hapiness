import { server, request } from 'websocket';
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
        const httpServer = http.createServer((_request, _response) => {
            /* istanbul ignore next */
            _response.writeHead(404);
            /* istanbul ignore next */
            _response.end();
        });
        httpServer.listen(config.port);
        delete config.port;
        const _config = Object.assign({ httpServer }, config);
        this.server = new server(_config);
        this.sockets = [];
        this.subscribers = [];
        this.server.on('request', _request => {
            this.onRequestHandler(_request);
        });
    }

    /**
     * Resquest handler
     * Accept the request
     *
     * @param  {request} _request
     */
    private onRequestHandler(_request: request) {
        const connection = _request.accept(null, _request.origin);
        const socket = new Socket(_request, connection);
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

    public getServer() {
        return this.server;
    }
}
