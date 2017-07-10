import { CoreModule, Extension, ExtensionWithConfig, OnExtensionLoad } from '../../core';
import { Observable } from 'rxjs/Observable';
import { server } from 'websocket';
import { WebSocketServer } from './server';
import * as Debug from 'debug';
const debug = Debug('hapiness:extension:socketserver');

export interface SocketConfig {
    port: number;
    autoAcceptConnections?: boolean;
    keepaliveInterval?: number;
    keepaliveGracePeriod?: number;
    closeTimeout?: number;
}

export class SocketServerExt implements OnExtensionLoad {

    private server: server;

    public static setConfig(config: SocketConfig): ExtensionWithConfig {
        return {
            token: SocketServerExt,
            config
        };
    }

    /**
     * Initilization of the extension
     * Create the socket server
     *
     * @param  {CoreModule} module
     * @param  {SocketConfig} config
     * @returns Observable
     */
    onExtensionLoad(module: CoreModule, config: SocketConfig): Observable<Extension> {
        debug('server instantiation');
        const instance = new WebSocketServer(config);
        return Observable.create(observer => {
            observer.next({
                instance: this,
                token: SocketServerExt,
                value: instance
            });
            observer.complete();
        })
    }
}
