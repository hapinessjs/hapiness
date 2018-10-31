import { suite, test } from 'mocha-typescript';
import { of } from 'rxjs';
import * as unit from 'unit.js';
import { Hapiness, HapinessModule, OnStart } from '../../src/core';
import { HttpServerExt } from '../../src/extensions/http-server';
import { SocketServerExt, SocketServerService } from '../../src/extensions/socket-server';

@suite('Integration - Socket Server')
export class SocketServerIntegration {

    @test('use same http instance from HttpServerExt')
    test1(done) {

        @HapinessModule({
            version: '1.0.0',
            providers: [ SocketServerService ]
        })
        class ModuleTest implements OnStart {

            constructor(private server: SocketServerService) {
            }

            onStart() {
                this
                    .server
                    .instance()
                    .configure(_ => of(true))
                    .subscribe(
                        socket => {
                            unit.array(this.server.instance().getSockets())
                                .hasLength(1);
                            socket.emit('toto', 'test');
                            socket.on('close', data => {
                            });
                            socket.on('error', data => {
                            });
                            socket.on('tata', data => {
                            });
                            socket.on('ev', data => {
                                this.server.instance().broadcast('test', 'test');
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
                                socket.emit('obs', 'obs');
                            });
                            socket
                                .on$('FINAL')
                                .subscribe(
                                    _ => {
                                        unit.string(_).is('final');
                                        socket.close();
                                        this.server.stop().subscribe(() => done());
                                    }
                                );
                        }
                    );

                const W3CWebSocket = require('websocket').w3cwebsocket;
                const client = new W3CWebSocket('ws://localhost:4555/');
                client.onmessage = (e) => {
                    if (e.data === JSON.stringify({ event: 'toto', data: 'test' })) {
                        client.send('{"event":"ev","data":"abc"}');
                    } else if (e.data instanceof ArrayBuffer) {
                        client.send(e.data);
                    } else if (e.data === JSON.stringify({ event: 'test', data: 'test' })) {
                        client.send('123');
                    } else {
                        client.send('{"event":"FINAL","data":"final"}');
                    }
                };
            }
        }

        Hapiness.bootstrap(ModuleTest, [
            HttpServerExt.setConfig({ host: 'localhost', port: 4555 }),
            SocketServerExt.setConfig({ useHttpExtension: true })
        ]);
    }

    @test('use same http instance from HttpServerExt - no HttpServerExt instance')
    test2(done) {

        @HapinessModule({
            version: '1.0.0'
        })
        class ModuleTest {
        }

        Hapiness.bootstrap(ModuleTest, [
            SocketServerExt.setConfig({ useHttpExtension: true })
        ]).catch(_ => {
            unit
                .object(_)
                .isInstanceOf(Error)
                .hasProperty('message', '[SocketServerExt] Could not find Http Server Extension');
            done();
        });
    }

}
