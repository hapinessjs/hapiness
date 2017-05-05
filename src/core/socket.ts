import { server, connection, request } from 'websocket';
import * as http from 'http';

export interface ServerSocketConfig {
    port: number;
}

export class ServerSocket {

    private server: server;
    private subscribers: Array<(socket: Socket) => void>;
    private sockets: Socket[];

    /**
     * Init socket server
     * Handle new connections
     *
     * @param  {ServerSocketConfig} config
     */
    constructor(config: ServerSocketConfig) {
        /* istanbul ignore next */
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
        this.server.on('request', req => {
            const connection = req.accept('echo-protocol', req.origin);
            const socket = new Socket(req, connection, this);
            const index = this.sockets.push(socket) - 1;
            this.subscribers.forEach(sub => sub.apply(this, [ socket ]));
            connection.on('close', conn => {
                this.sockets.splice(index, 1);
            });
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

export class Socket {

    constructor(
        private request: request,
        private connection: connection,
        private server: ServerSocket
    ) {}

    /**
     * Listen events
     *
     * @param  {string} event
     * @param  {()=>void} callback
     */
    on(event: string, callback: () => void) {
        this.connection.on(event, callback);
    }

    /**
     * Send data
     *
     * @param  {string} event
     * @param  {any} data
     */
    emit(event: string, data: any) {
        this.connection.sendUTF(JSON.stringify({
            type: event,
            data
        }));
    }

    /**
     * Close connection
     */
    close() {
        this.connection.close();
    }
}
