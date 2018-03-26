import { Hapiness, HttpServerExt } from '../../';
import { Observable, Subject } from 'rxjs/Rx';
import { server, request } from 'websocket';
import { Socket } from './socket';
import { SocketConfig } from './extension';
import * as http from 'http';
import * as https from 'https';
import { WebSocketRooms } from './rooms';

export class WebSocketServer {
    private server: server;
    private connections$ = new Subject<Socket>();
    private sockets: Socket[];
    private httpServer: http.Server | https.Server;
    private rooms: WebSocketRooms;
    private secure: ((request: request) => Observable<boolean>) = () => Observable.of(true);

    constructor(private config: SocketConfig) {}

    public start() {
        this.httpServer = !!this.config.useHttpExtension ? this.getHttpServerExt() : this.createHttpServer();
        const _config = Object.assign({ httpServer: <any>this.httpServer }, this.config, { port: undefined });
        this.server = new server(_config);
        this.sockets = [];
        this.server.on('request', _request => {
            this
                .secure(_request)
                .subscribe(
                    _ => !!_ ?
                        this.onRequestHandler(_request) :
                        _request.reject(403, 'Forbidden')
                );
        });
        this.rooms = new WebSocketRooms();
    }

    /**
     * Close all sockets and close http server
     *
     * @returns Observable
     */
    public stop(): Observable<boolean> {
        return Observable
            .from(this.getSockets())
            .do(_ => _.close())
            .toArray()
            .flatMap(_ => Observable
                .create(obs => {
                    if (!this.config.useHttpExtension) {
                        this.httpServer.close(() => obs.next())
                    } else {
                        obs.next();
                    }
                })
            )
            .map(_ => true);
    }

    /**
     * Get Http Server Extension instance
     * @FIXME Just take the first HapiJS connection for now
     */
    private getHttpServerExt() {
        const ext = Hapiness['extensions'].find(_ => _.token === HttpServerExt);
        if (!!ext) {
            return ext.value.connections[0].listener;
        } else {
            throw new Error('Cound not find Http Server Extension');
        }
    }

    /**
     * Create Http Server for websocket
     *
     * @returns http
     */
    private createHttpServer(): http.Server | https.Server {
        if (!this.config.port) {
            throw new Error('WS port not provided');
        }
        /* istanbul ignore next */
        const httpHandler = (_request, _response) => {
            _response.writeHead(404);
            _response.end();
        };
        const httpServer = !!this.config.tls ? https.createServer(this.config.tls, httpHandler) : http.createServer(httpHandler);
        httpServer.listen(this.config.port);
        return httpServer;
    }

    /**
     * Resquest handler
     * Accept the request
     *
     * @param  {request} _request
     */
    private onRequestHandler(_request: request): void {
        const connection = _request.accept(null, _request.origin);
        const socket = new Socket(_request, connection, this.rooms);
        const index = this.sockets.push(socket) - 1;
        connection.on('close', conn => {
            this.sockets.splice(index, 1);
        });
        this.connections$.next(socket);
    }

    /**
     * Configure a secure callback
     * to accept/reject requests
     *
     * @param  {(request:request)=>Observable<boolean>} secure
     * @returns Subject
     */
    public configure(secure: (request: request) => Observable<boolean>): Subject<Socket> {
        this.secure = (!!secure ? secure : this.secure);
        return this.connections$;
    }

    /**
     * Get connections Subject
     *
     * @returns Subject
     */
    public connections(): Subject<Socket> {
        return this.connections$;
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
        this.server.broadcastUTF(
            JSON.stringify({
                event,
                data
            })
        );
    }

    /**
     * Send a message to all sockets present in a room
     *
     * @param {string} room
     * @param {string} event
     * @param {any} data
     * @returns WebSocketServer
     */
    public to(room: string, event: string, data: any) {
        this.rooms.emit(room, event, data);
        return this;
    }

    public getServer() {
        return this.server;
    }

    public getHttpServer() {
        return this.httpServer;
    }
}
