import { suite, test, only} from 'mocha-typescript';
import { Observable, SubscribableOrPromise } from 'rxjs/Observable';
import { ConsumerType } from 'tslint/lib';
import * as unit from 'unit.js';
import { Hapiness, HapinessModule, Injectable, Inject, OnError, OnRegister, OnStart } from '../../src/core';
import { HttpServerExt, Route, Lifecycle, OnGet, OnEvent, OnPreResponse } from '../../src/extensions/http-server';
import { Server } from 'hapi';

@suite('Integration - Http Server')
class HttpServerIntegration {

    @test('route get')
    test1(done) {

        @Route({
            path: '/',
            method: 'GET',
        })
        class RouteTest implements OnGet {
            onGet(request, reply) {
                reply('test');
            }
        }

        @HapinessModule({
            version: '1.0.0',
            declarations: [ RouteTest ]
        })
        class ModuleTest implements OnStart {

            constructor(@Inject(HttpServerExt) private server: Server) {}

            onStart() {
                this.server.inject('/', res => {
                    unit.must(res.result).equal('test');
                    done();
                });
            }
        }

        Hapiness.bootstrap(ModuleTest, [ HttpServerExt.setConfig({ host: '0.0.0.0', port: 4444 }) ]);
    }

    @test('lifecycle')
    test2(done) {

        class Service1 {
            getData() {
                return '123';
            }
        }
        class Service2 {}
        class Service3 {
            getData() {
                return '456';
            }
        }

        @Route({
            path: '/',
            method: 'GET',
            providers: [ Service1, { provide: Service2, useClass: Service2 } ]
        })
        class RouteTest implements OnGet, OnPreResponse {
            constructor(private serv: Service1, private serv3: Service3) {}
            onGet(request, reply) {
                reply('x');
            }
            onPreResponse(request, reply) {
                request.response.source = request.response.source + this.serv.getData() + this.serv3.getData();
                reply.continue();
            }
        }

        @Lifecycle({
            event: 'onPostHandler'
        })
        class LF implements OnEvent {
            onEvent(request, reply) {
                request.response.source = 'toto';
                reply.continue();
            }
        }

        @HapinessModule({
            version: '1.0.0',
            declarations: [ RouteTest, LF ],
            providers: [ Service3 ]
        })
        class ModuleTest implements OnStart {

            constructor(@Inject(HttpServerExt) private server: Server) {}

            onStart() {
                this.server.inject('/', res => {
                    unit.string(res.result)
                        .is('toto123456');
                    done();
                });
            }
        }

        Hapiness.bootstrap(ModuleTest, [ HttpServerExt.setConfig({ host: '0.0.0.0', port: 4445 }) ])
            .catch(_ => done(_));
    }

    @test('route submodule')
    test3(done) {

        @Route({
            path: '/',
            method: 'GET',
        })
        class RouteTest implements OnGet {
            onGet(request, reply) {
                reply('test');
            }
        }

        @HapinessModule({
            version: '1.0.0',
            declarations: [ RouteTest ]
        })
        class SubModuleTest {}

        @HapinessModule({
            version: '1.0.0',
            imports: [ SubModuleTest ]
        })
        class ModuleTest implements OnStart {

            constructor(@Inject(HttpServerExt) private server: Server) {}

            onStart() {
                this.server.inject('/', res => {
                    unit.must(res.result).equal('test');
                    done();
                });
            }
        }

        Hapiness.bootstrap(ModuleTest, [ HttpServerExt.setConfig({ host: '0.0.0.0', port: 4446 }) ]);
    }

    @test('port already used')
    test4(done) {

        @HapinessModule({
            version: '1.0.0'
        })
        class ModuleTest {}

        Hapiness.bootstrap(ModuleTest, [ HttpServerExt.setConfig({ host: '0.0.0.0', port: 4446 }) ]).catch(_ => {
            unit.object(_)
                    .isInstanceOf(Error)
                    .hasProperty('message', 'listen EADDRINUSE 0.0.0.0:4446');
                done();
        });
    }
}
