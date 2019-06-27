import { Service, Inject } from '../core/decorators';
import { HttpServer, FastifyServer } from './extension';
import { Socket } from './socket';
import { Subject } from 'rxjs';

@Service({ moduleOnly: true })
export class HttpServerService {

    constructor(@Inject(HttpServer) private server: FastifyServer) {}

    instance(): FastifyServer {
        return this.server;
    }

    websockets(): Subject<Socket> {
        if (!this.server.wsHandler) {
            return new Subject();
        }
        return this.server.wsHandler.getConnectionsStream();
    }

    wsSendToRoom(room: string, event: string, data?: any): void {
        if (!this.server.wsHandler) {
            return null;
        }
        this.server.wsHandler.to(room, event, data);
    }

    wsBroadcast(event: string, data: any): void {
        if (!this.server.wsHandler) {
            return null;
        }
        this.server.wsHandler.broadcast(event, data);
    }
}
