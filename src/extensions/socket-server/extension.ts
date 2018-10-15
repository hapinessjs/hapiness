import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
    CoreModule,
    Extension,
    ExtensionShutdown,
    ExtensionShutdownPriority,
    ExtensionWithConfig,
    OnExtensionLoad,
    OnModuleInstantiated,
    OnShutdown
} from '../../core';
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

export class SocketServerExt implements OnExtensionLoad, OnModuleInstantiated, OnShutdown {

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
        return of(new WebSocketServer(config))
            .pipe(
                map(_ => ({
                    instance: this,
                    token: SocketServerExt,
                    value: _
                }))
            );
    }

    /**
     * Start socket server
     *
     * @param  {CoreModule} module
     * @param  {WebSocketServer} server
     * @returns Observable
     */
    onModuleInstantiated(module: CoreModule, server: WebSocketServer): Observable<any> {
        return of(server)
            .pipe(
                map(_ => _.start())
            );
    }

    /**
     * Shutdown HapiJS server extension
     *
     * @param  {CoreModule} module
     * @param  {Server} server
     * @returns ExtensionShutdown
     */
    onShutdown(module: CoreModule, server: WebSocketServer): ExtensionShutdown {
        return {
            priority: ExtensionShutdownPriority.IMPORTANT,
            resolver: server.stop()
        }
    }
}
