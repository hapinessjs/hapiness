import { connection, request } from 'websocket';

export class Socket {

    constructor(
        private _request: request,
        private _connection: connection
    ) {}

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
                        const parsed = this.getJSON(message.utf8Data);
                        if (parsed.event === event) { callback(parsed.data); }
                    }
                });
        }
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
        this._connection.sendUTF(JSON.stringify({
            event,
            data
        }));
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

    private getJSON(data: string) {
        try {
            return JSON.parse(data);
        } catch (e) {
            /* istanbul ignore next */
            return {};
        }
    }
}
