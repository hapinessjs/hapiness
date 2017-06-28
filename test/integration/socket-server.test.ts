import { suite, test, only} from 'mocha-typescript';
import { Observable, SubscribableOrPromise } from 'rxjs/Observable';
import { ConsumerType } from 'tslint/lib';
import * as unit from 'unit.js';
import { Hapiness, HapinessModule, Injectable, Inject, OnError, OnRegister, OnStart } from '../../src/core';
import { SocketServerExt, WebSocketServer } from '../../src/extensions/socket-server';

@suite('Integration - Socket Server')
class SocketServerIntegration {

    @test('socket message')
    test1(done) {

        @HapinessModule({
            version: '1.0.0'
        })
        class ModuleTest implements OnStart {

            constructor(@Inject(SocketServerExt) private server: WebSocketServer) {}

            onStart() {
                this.server.onRequest(socket => {
                    unit.array(this.server.getSockets())
                        .hasLength(1);
                    socket.emit('toto', 'test');
                    socket.on('close', data => {});
                    socket.on('error', data => {});
                    socket.on('tata', data => {});
                    socket.on('ev', data => {
                        this.server.broadcast('test', 'test');
                    });
                    socket.on('*', data => {
                        if (data.utf8Data === '123') {
                            unit.string(data.utf8Data)
                                .is('123');
                            socket.emitBytes(new Buffer('test'));
                        }
                    });
                    socket.onBytes(data => {
                        unit.string(data.toString())
                            .is('test');
                        socket.close();
                        this.server.getServer().closeAllConnections();
                        done();
                    });
                });

                const W3CWebSocket = require('websocket').w3cwebsocket;
                const client = new W3CWebSocket('ws://localhost:2222/');
                client.onmessage = (e) => {
                    if (e.data === JSON.stringify({ event: 'toto', data: 'test' })) {
                        client.send('{"event":"ev","data":"abc"}');
                    } else if (e.data instanceof ArrayBuffer) {
                        client.send(e.data);
                    } else {
                        client.send('123');
                    }
                };
            }
        }

        Hapiness.bootstrap(ModuleTest, [ SocketServerExt.setConfig({ port: 2222 }) ]);
    }
}
