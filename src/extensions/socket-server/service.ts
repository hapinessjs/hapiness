import { Injectable, Inject } from '../../core';
import { WebSocketServer } from './server';
import { SocketServerExt } from './extension';
import { Observable } from 'rxjs';

@Injectable()
export class SocketServerService {

    constructor(
        @Inject(SocketServerExt) private socketServer: WebSocketServer
    ) {}

    /**
     * Get WebSocket Server instance
     *
     * @returns Server
     */
    instance(): WebSocketServer {
        return this.socketServer;
    }

    /**
     * Stop the WebSocket Server
     *
     * @returns Observable
     */
    stop(): Observable<void> {
        return Observable
            .of(this.socketServer)
            .do(_ => _.getHttpServer().close())
            .do(_ => _.getServer().shutDown())
            .map(_ => null);
    }

}
