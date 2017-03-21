import { OnGet } from '../../src/route/hook';
import { OnStart } from '../../src/module/hook';
import { Hapiness } from '../../src/core';
import { RouteBuilder } from '../../src/route';
import { test, suite, only } from 'mocha-typescript';
import * as unit from 'unit.js';
import { HapinessModule, Route, ModuleBuilder } from '../../src';

@suite('Route')
class Routes {

    @test('Metadata extraction')
    testMetadataExtraction() {

        @Route({
            path: 'test',
            method: 'get'
        })
        class MyRoute {}

        @HapinessModule({
            version: 'xx',
            declarations: [ MyRoute ]
        })
        class MyModule {}

        const module = ModuleBuilder.buildModule(MyModule);
        const route  = RouteBuilder.buildRoute(module).shift();

        unit.must(route.method).equal('get');
        unit.must(route.path).equal('test');
        unit.must(route.token).equal(MyRoute);

    }

    @test('Test GET')
    testGet(done) {

        @Route({
            path: '/test',
            method: 'GET'
        })
        class MyRoute implements OnGet {
            onGet(req, reply) {
                reply('success');
            }
        }

        @HapinessModule({
            version: '1.0.0',
            options: { host: '0.0.0.0', port: 4460 },
            declarations: [ MyRoute ]
        })
        class TestGet implements OnStart {
            onStart() {
                Hapiness['mainModule'].server.inject('/test', res => {
                    unit.must(res.result).equal('success');
                    Hapiness.kill().subscribe(() => done());
                });
            }
        }

        Hapiness.bootstrap(TestGet)
            .then(() => {});

    }

    @test('Test GET with providers')
    testGetProviders(done) {

        class ServiceA {
            data() {
                return 'A';
            }
        }

        class ServiceB {
            data() {
                return 'B';
            }
        }

        class ServiceC {
            data() {
                return 'C';
            }
        }

        @Route({
            path: '/test',
            method: 'GET',
            providers: [ {provide: ServiceA, useClass: ServiceA}, ServiceC ]
        })
        class MyRoute implements OnGet {
            constructor(private svcA: ServiceA, private svcB: ServiceB, private svcC: ServiceC) {}
            onGet(req, reply) {
                reply('' + this.svcA.data() + this.svcB.data() + this.svcC.data());
            }
        }

        @HapinessModule({
            version: '1.0.0',
            options: { host: '0.0.0.0', port: 4461 },
            declarations: [ MyRoute ],
            providers: [ ServiceB ]
        })
        class TestGet implements OnStart {
            onStart() {
                Hapiness['mainModule'].server.inject('/test', res => {
                    unit.must(res.result).equal('ABC');
                    Hapiness.kill().subscribe(() => done());
                });
            }
        }

        Hapiness.bootstrap(TestGet)
            .then(() => {});

    }
}
