// import { WebSocketRooms } from './rooms';
import { Subject, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { Connection, WSRequest } from './wsmanager';
import { WebSocketRooms } from './rooms';

interface Message {
    event: string;
    data: any;
}

export class Socket {
    private data$ = new Subject<Message>();
    private store: { [key: string]: any } = {};

    constructor(
        public request: WSRequest,
        private connection: Connection,
        private rooms: WebSocketRooms
    ) {
        this.join('default-room');
        this.on('close', () => this.data$.complete());
        this.on('error', err => this.data$.error(err));
        this.on('*', data => this.data$.next(this.getJSON(data)));
    }

    /**
     * Listen events
     *
     * @param  {string} event
     * @param  {(data: any)=>void} callback
     */
    on(event: string, callback: (data: any) => void) {
        switch (event) {
            case '*':
                this.connection.socket.on('message', callback);
                break;
            case 'close':
                this.connection.socket.on(event, callback);
                break;
            case 'error':
                this.connection.socket.on(event, callback);
                break;
            default:
                this.connection.socket.on('message', message => {
                    if (typeof message.valueOf() === 'string') {
                        const parsed = <Message>this.getJSON(message.toString());
                        if (parsed.event === event) {
                            callback(parsed.data);
                        }
                    }
                });
        }
    }

    /**
     * Listen data filtered by event
     * in a Observable
     *
     * @param  {string} event
     * @returns Observable
     */
    on$<T = any>(event: string): Observable<T> {
        return this
            .data$.pipe(
                filter(message => message && message.event === event),
                map(message => <T>message.data)
            );
    }

    /**
     * Listen to binary data
     *
     * @param  {(data:Buffer)=>void} callback
     */
    onBytes(callback: (data: Buffer) => void) {
        this.connection.socket.on('message', message => {
            if (typeof message.valueOf() !== 'string') {
                callback(Buffer.from(message.toString()));
            }
        });
    }

    /**
     * Send data
     *
     * @param  {string} event
     * @param  {any} data
     */
    emit(event: string, data: any) {
        this.connection.socket.send(
            JSON.stringify({
                event,
                data
            })
        );
    }

    /**
     * Send bytes
     *
     * @param  {Buffer} data
     */
    emitBytes(data: Buffer) {
        this.connection.socket.send(data);
    }

    /**
     * Close connection
     */
    close() {
        this.connection.socket.close();
    }

    join(room: string): Socket {
        this.rooms.join(room, this);

        /* Leave room when socket connection is closed */
        this.on('close', () => {
            this.rooms.leave(room, this);
        });

        return this;
    }

    leave(room: string): Socket {
        this.rooms.leave(room, this);
        return this;
    }

    setData(key: string, value: any): Socket {
        this.store[key] = value;
        return this;
    }

    getData(key: string): any {
        return this.store[key];
    }

    private getJSON(data: string) {
        try {
            return JSON.parse(data);
        } catch (e) {
            /* istanbul ignore next */
            return data;
        }
    }
}
