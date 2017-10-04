import { suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { Hapiness, HapinessModule, Inject, OnRegister, OnStart, OnError } from '../../src/core';
import { HttpServerExt, Route, Lifecycle, OnGet, OnEvent, OnPreResponse, HttpServerService } from '../../src/extensions/http-server';
import { Server } from 'hapi';
import { Observable } from 'rxjs';

@suite('Integration - Http Server')
export class HttpServerIntegration {

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
            declarations: [ RouteTest ],
            providers: [ HttpServerService ]
        })
        class ModuleTest implements OnStart {

            constructor(private server: HttpServerService) {}

            onStart() {
                this.server.instance().inject('/', res => {
                    unit.must(res.result).equal('test');
                    this.server.stop().subscribe(_ => done());
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
            method: 'GET'
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
            providers: [ Service3, Service1, { provide: Service2, useClass: Service2 }  ]
        })
        class ModuleTest implements OnStart {

            constructor(@Inject(HttpServerExt) private server: Server) {}

            onStart() {
                this.server.inject('/', res => {
                    unit.string(res.result)
                        .is('toto123456');
                    this.server.stop().then(_ => done());
                });
            }
        }

        Hapiness.bootstrap(ModuleTest, [ HttpServerExt.setConfig({ host: '0.0.0.0', port: 4444 }) ])
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

        Hapiness.bootstrap(ModuleTest, [ HttpServerExt.setConfig({ host: '0.0.0.0', port: 4444 }) ]);
    }

    @test('port already used')
    test4(done) {

        @HapinessModule({
            version: '1.0.0'
        })
        class ModuleTest {}

        Hapiness.bootstrap(ModuleTest, [ HttpServerExt.setConfig({ host: '0.0.0.0', port: 4444 }) ]).catch(_ => {
            unit.object(_)
                    .isInstanceOf(Error)
                    .hasProperty('message', 'listen EADDRINUSE 0.0.0.0:4444');
            Hapiness['extensions'][0].value.stop().then(__ => done());
        });
    }

    @test('make sure register are done before start hook')
    test5(done) {

        @HapinessModule({
            version: '1.0.0'
        })
        class SubModuleTest implements OnRegister {
            constructor(@Inject(HttpServerExt) private server: Server) {}
            onRegister() {
                this.server.route({
                    path: '/route1',
                    method: 'GET',
                    handler: () => {}
                });
            }
        }

        @HapinessModule({
            version: '1.0.0',
            imports: [ SubModuleTest ]
        })
        class ModuleTest implements OnStart {
            constructor(@Inject(HttpServerExt) private server: Server) {}
            onStart() {
                unit.object(this.server.table().pop().table.pop())
                    .hasProperty('path', '/route1');
                this.server.stop().then(_ => done());
            }
        }

        Hapiness.bootstrap(ModuleTest, [ HttpServerExt.setConfig({ host: '0.0.0.0', port: 4445 }) ]);
    }

    @test('response with Observable')
    test6(done) {

        @Route({
            path: '/',
            method: 'GET',
        })
        class RouteTest implements OnGet {
            onGet(request, reply) {
                return Observable
                    .of('test');
            }
        }

        @Route({
            path: '/2',
            method: 'GET',
        })
        class RouteTest2 implements OnGet {
            onGet(request, reply) {
                reply('test2');
            }
        }

        @Route({
            path: '/3',
            method: 'GET',
        })
        class RouteTest3 implements OnGet {
            onGet(request, reply) {
                return Observable
                    .of({ response: 'test3', statusCode: 201 });
            }
        }

        @HapinessModule({
            version: '1.0.0',
            declarations: [ RouteTest, RouteTest2, RouteTest3 ]
        })
        class ModuleTest implements OnStart {
            constructor(@Inject(HttpServerExt) private server: Server) {}
            onStart() {
                this.server.inject('/', res => {
                    unit.string(res.result)
                        .is('test');
                    unit.value(res.statusCode)
                        .is(200)
                    this.server.inject('/2', res2 => {
                        unit.string(res2.result)
                            .is('test2');
                        this.server.inject('/3', res3 => {
                            unit.string(res3.result)
                                .is('test3');
                            unit.value(res3.statusCode)
                                .is(201)
                            this.server.stop().then(_ => done());
                        });
                    });
                });
            }
        }

        Hapiness.bootstrap(ModuleTest, [ HttpServerExt.setConfig({ host: '0.0.0.0', port: 4445 }) ]);
    }

    @test('throw error in route')
    test7(done) {

        @Route({
            path: '/',
            method: 'GET'
        })
        class RouteTest implements OnGet {
            onGet(request, reply) {
                throw new Error('Oops');
            }
        }

        @HapinessModule({
            version: '1.0.0',
            declarations: [ RouteTest ]
        })
        class ModuleTest implements OnStart, OnError {

            constructor(@Inject(HttpServerExt) private server: Server) {}

            onStart() {
                this.server.inject('/', res => {
                    unit.must(res.statusCode).equal(500);
                });
            }

            onError(error) {
                unit
                    .object(error)
                    .isInstanceOf(Error)
                    .hasProperty('message', 'Oops');
                this.server.stop().then(_ => done());
            }
        }

        Hapiness.bootstrap(ModuleTest, [ HttpServerExt.setConfig({ host: '0.0.0.0', port: 4445 }) ]);
    }
}
