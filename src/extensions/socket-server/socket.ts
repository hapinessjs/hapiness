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
    on(event: 'message', callback: (data: any) => void) {
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
