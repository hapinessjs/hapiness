import { CoreModule, Extension, ExtensionWithConfig, OnExtensionLoad } from '../../core/interfaces';
import { Observable } from 'rxjs/Observable';
import { server } from 'websocket';
import { WebSocketServer } from './server';

export interface SocketConfig {
    port: number;
    autoAcceptConnections?: boolean;
    keepaliveInterval?: number;
    keepaliveGracePeriod?: number;
    closeTimeout?: number;
    tls?: {
        key: Buffer;
        cert: Buffer;
    }
}

export class SocketServerExt implements OnExtensionLoad {

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
        return Observable
            .of(new WebSocketServer(config))
            .map(_ => ({
                instance: this,
                token: SocketServerExt,
                value: _
            }));
    }
}
