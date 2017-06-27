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
                    socket.emit('message', 'test');
                    socket.on('message', data => {
                        unit.string(data.utf8Data)
                            .is('123');
                        this.server.broadcast('message', 'test');
                        socket.close();
                        done();
                    });
                });

                const W3CWebSocket = require('websocket').w3cwebsocket;
                const client = new W3CWebSocket('ws://localhost:2222/');
                client.onmessage = (e) => {
                    unit.string(e.data)
                        .is(JSON.stringify({ type: 'message', data: 'test' }));
                    client.send('123');
                };
            }
        }

        Hapiness.bootstrap(ModuleTest, [ SocketServerExt.setConfig({ port: 2222 }) ]);
    }
}
