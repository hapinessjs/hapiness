import { suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { Hapiness, HapinessModule, OnStart } from '../../src/core';
import { HttpServerExt, HttpServerService, Route } from '../../src/extensions/http-server';

@suite('Integration - Http Server Multiple Connections')
export class SocketServerRoomIntegration {

    @test('should have 2 ports')
    test1(done) {
        @HapinessModule({
            version: '1.0.0',
            providers: [ HttpServerService ]
        })
        class ModuleTest implements OnStart {

            constructor(private server: HttpServerService) {}

            onStart() {
                this
                    .server
                    .instance()
                    .connections
                    .forEach(_ => { _.inject('/', res => unit.number(res.statusCode).is(404)); });

                this.server.stop().subscribe(_ => done());
            }
        }

        Hapiness.bootstrap(ModuleTest, [
            HttpServerExt.setConfig({
                connections: [
                    { port: 5555, labels: 'one' },
                    { port: 6666 }
                ]
            })
        ]);
    }

    @test('should have 2 ports and have one route each')
    test2(done) {

        @Route({
            method: 'get',
            path: '/',
            labels: 'one'
        })
        class Route1 {
            onGet() {
                return 'ok_1';
            }
        }

        @Route({
            method: 'get',
            path: '/',
            labels: 'two'
        })
        class Route2 {
            onGet() {
                return 'ok_2';
            }
        }


        @HapinessModule({
            version: '1.0.0',
            providers: [ HttpServerService ],
            declarations: [ Route1, Route2 ]
        })
        class ModuleTest implements OnStart {

            constructor(private server: HttpServerService) {}

            onStart() {
                this
                    .server
                    .instance()
                    .select('one')
                    .connections[0]
                    .inject('/', res => {
                        unit.string(res.result).is('ok_1');
                        this
                            .server
                            .instance()
                            .select('two')
                            .connections[0]
                            .inject('/', _res => {
                                unit.string(_res.result).is('ok_2');
                                this.server.stop().subscribe(_ => done());
                            });
                    });
            }
        }

        Hapiness.bootstrap(ModuleTest, [
            HttpServerExt.setConfig({
                connections: [
                    { port: 5555, labels: 'one' },
                    { port: 6666, labels: 'two' }
                ]
            })
        ]);
    }

}
