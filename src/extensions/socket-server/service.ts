import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Inject, Injectable } from '../../core';
import { SocketServerExt } from './extension';
import { WebSocketServer } from './server';

@Injectable()
export class SocketServerService {

    constructor(
        @Inject(SocketServerExt) private socketServer: WebSocketServer
    ) {
    }

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
        return of(this.socketServer)
            .pipe(
                tap(_ => _.getHttpServer().close()),
                tap(_ => _.getServer().shutDown()),
                map(_ => null)
            );
    }

}
