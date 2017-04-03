import * as websocket from 'websocket';
import * as http from 'http';

export interface ServerSocketConfig {
    port: number;
}

export class ServerSocket {

    public server: websocket.server;

    constructor(config: ServerSocketConfig) {
        /* istanbul ignore next */
        const server = http.createServer((request, response) => {
            response.writeHead(404);
            response.end();
        });
        server.listen(config.port);
        this.server = new websocket.server({
            httpServer: server,
            autoAcceptConnections: false
        });
        // wsServer.on('request', req => {
        //    this.connection = req.accept('echo-protocol', req.origin);
        // });
    }
}
