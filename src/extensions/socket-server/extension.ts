import { CoreModule, Extension, ExtensionWithConfig, OnExtensionLoad, OnModuleInstantiated } from '../../core/interfaces';
import { Observable } from 'rxjs/Observable';
import { WebSocketServer } from './server';

export interface SocketConfig {
    port?: number;
    autoAcceptConnections?: boolean;
    keepaliveInterval?: number;
    keepaliveGracePeriod?: number;
    closeTimeout?: number;
    useHttpExtension?: boolean;
    tls?: {
        key: Buffer;
        cert: Buffer;
    }
}

export class SocketServerExt implements OnExtensionLoad, OnModuleInstantiated {

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

    /**
     * Start socket server
     *
     * @param  {CoreModule} module
     * @param  {WebSocketServer} server
     * @returns Observable
     */
    onModuleInstantiated(module: CoreModule, server: WebSocketServer): Observable<any> {
        return Observable
            .of(server)
            .map(_ => _.start());
    }
}
