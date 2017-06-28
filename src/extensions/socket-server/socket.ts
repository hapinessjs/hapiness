import { connection, request } from 'websocket';

export class Socket {

    constructor(
        private request: request,
        private connection: connection
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
                this.connection.on('message', callback);
                break;
            case 'close':
                this.connection.on(event, callback);
                break;
            case 'error':
                this.connection.on(event, callback);
                break;
            default:
                this.connection.on('message', message => {
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
        this.connection.on('message', message => {
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
        this.connection.sendUTF(JSON.stringify({
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
        this.connection.sendBytes(data);
    }

    /**
     * Close connection
     */
    close() {
        this.connection.close();
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
