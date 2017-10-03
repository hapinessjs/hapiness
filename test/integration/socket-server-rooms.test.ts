import { suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { Hapiness, HapinessModule, Inject, OnStart } from '../../src/core';
import { SocketServerExt, WebSocketServer, SocketServerService } from '../../src/extensions/socket-server';

@suite('Integration - Socket Server')
class SocketServerIntegration {

    @test('socket message')
    test1(done) {

        @HapinessModule({
            version: '1.0.0',
            providers: [ SocketServerService ]
        })
        class ModuleTest implements OnStart {

            constructor(private server: SocketServerService) {}

            onStart() {
                this.server.instance().onRequest(socket => {
                    unit.array(this.server.instance().getSockets())
                        .hasLength(1);
                    socket
                        .join('room1')
                        .join('room2');
                        socket.on('close', data => {});
                        socket.on('error', data => {});
                        socket.on('tata', data => {});
                        socket.on('*', data => {
                            unit.string(data.utf8Data).is('received');
                            socket.close();
                            this
                                .server
                                .stop()
                                .subscribe(_ => done());
                        });
                        this.server.instance().to('room1', 'message', { foo: 'bar' });
                });

                const W3CWebSocket = require('websocket').w3cwebsocket;
                const client = new W3CWebSocket('ws://localhost:2223/');
                client.onmessage = (e) => {
                    const data = JSON.parse(e.data);
                    if (data.event === 'message' && data.data.foo === 'bar') {
                      client.send('received');
                    } else {
                      client.send('nope');
                    }
                };
            }
        }

        Hapiness.bootstrap(ModuleTest, [ SocketServerExt.setConfig({ port: 2223 }) ]);
    }

}
