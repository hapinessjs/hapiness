import * as Hapi from 'hapi';
import { ServerSocket } from './socket';

/**
 * class HttpServer
 * Used to be injected
 * in a module's DI providing
 * access to the server instance
 */
export class HttpServer {

    /**
     * Core server instance
     */
    private _instance: Hapi.Server;

    constructor(coreServer: Hapi.Server) {
        this._instance = coreServer;
    }

    /**
     * Gettor instance
     */
    public get instance() {
        return this._instance;
    }
}

/**
 * class WSServer
 * Used to be injected
 * in a module's DI providing
 * access to the socket server instance
 */
export class WSServer {
    /**
     * Core server instance
     */
    private _instance: ServerSocket;

    constructor(coreServer: ServerSocket) {
        this._instance = coreServer;
    }

    /**
     * Gettor instance
     */
    public get instance() {
        return this._instance;
    }
}
