import { Subject } from 'rxjs';
import { Transform } from 'stream';
import { Socket } from './socket';
import * as WS from 'ws';
import { WebSocketRooms } from './rooms';

export type Connection = Transform & { socket: WS };
export interface WSRequest {
    method: string;
    url: string;
    headers: { [name: string]: string };
}

export class WebsocketManager {
    private connections$ = new Subject<Socket>();
    private rooms = new WebSocketRooms();

    public handler(connection: Connection, request: WSRequest) {
        this.connections$.next(new Socket(request, connection, this.rooms));
    }

    public getConnectionsStream(): Subject<Socket> {
        return this.connections$;
    }

    public broadcast(event: string, data: any): void {
        this.rooms.emit('default-room', event, data);
    }

    public close() {
        this.rooms.getRooms()['default-room'].forEach(socket => socket.close());
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
}
