import { connection, request as WSRequest } from 'websocket';
import { WebSocketRooms } from './rooms';
import { Subject, Observable } from 'rxjs/Rx';
import { InternalLogger } from '../../core/logger';

interface Message {
    event: string;
    data: any;
}

export class Socket {

    private static logger = new InternalLogger('module');

    private data$ = new Subject<Message>();

    private store: { [key: string]: any } = {};

    constructor(
        public request: WSRequest,
        private _connection: connection,
        private _rooms: WebSocketRooms
    ) {
        this.on('close', data => this.data$.complete());
        this.on('error', err => this.data$.error(err));
        this.on('*', data => this.data$.next(this.getJSON(data.utf8Data)));
        Socket.logger.debug(`New socket... ${this.request.host}`);
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
                this._connection.on('message', callback);
                break;
            case 'close':
                this._connection.on(event, callback);
                break;
            case 'error':
                this._connection.on(event, callback);
                break;
            default:
                this._connection.on('message', message => {
                    if (message.type === 'utf8') {
                        const parsed = <Message>this.getJSON(message.utf8Data);
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
            .data$
            .filter(_ => _ && _.event === event)
            .map(_ => <T>_.data);
    }

    /**
     * Listen to binary data
     *
     * @param  {(data:Buffer)=>void} callback
     */
    onBytes(callback: (data: Buffer) => void) {
        this._connection.on('message', message => {
            if (message.type === 'binary') {
                callback(message.binaryData);
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
        this._connection.sendUTF(
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
        this._connection.sendBytes(data);
    }

    /**
     * Close connection
     */
    close() {
        this._connection.close();
    }

    drop(reasonCode?: number, description?: string): void {
        this._connection.drop(reasonCode, description);
    }

    join(room: string): Socket {
        this._rooms.join(room, this);

        /* Leave room when socket connection is closed */
        this.on('close', () => {
            this._rooms.leave(room, this);
        });

        return this;
    }

    leave(room: string): Socket {
        this._rooms.leave(room, this);
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
