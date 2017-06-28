import { ExtensionWithConfig } from '../../core';
import { Extension, OnExtensionLoad, OnModuleInstantiated } from '../../core/bootstrap';
import { DependencyInjection } from '../../core/di';
import { HookManager } from '../../core/hook';
import { CoreModule, ModuleLevel, ModuleManager } from '../../core/module';
import { Observable } from 'rxjs/Observable';
import { server, connection, request } from 'websocket';
import { Socket } from './socket';
import { WebSocketServer } from './server';
import * as http from 'http';
import * as Boom from 'boom';
import * as Hoek from 'hoek';
import * as Debug from 'debug';
const debug = Debug('hapiness:extension:socketserver');

export interface SocketConfig {
    port: number;
}

export class SocketServerExt implements OnExtensionLoad {

    private server: server;
    private subscribers: Array<(socket: Socket) => void>;
    private sockets: Socket[];

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
