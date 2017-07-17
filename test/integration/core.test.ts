import { suite, test } from 'mocha-typescript';
import { Observable } from 'rxjs/Observable';
import * as unit from 'unit.js';
import {
    Hapiness,
    HapinessModule,
    Injectable,
    OnStart,
    OnRegister,
    Lib,
    InjectionToken,
    Inject
} from '../../src/core';

@suite('Integration - Core')
class CoreIntegration {

    @test('HapinessModule')
    test1(done) {

        @HapinessModule({
            version: '1.0.0'
        })
        class ModuleTest implements OnStart {
            onStart() {
                unit.string(Hapiness['module'].name)
                    .is('ModuleTest');
                done();
            }
        }

        Hapiness.bootstrap(ModuleTest);
    }

    @test('HapinessModule - DI')
    test2(done) {

        @Injectable()
        class Service1 {
            getData() {
                return 'test';
            }
        }

        @HapinessModule({
            version: '1.0.0',
            providers: [ Service1 ]
        })
        class ModuleTest implements OnStart {

            constructor(private service: Service1) {}

            onStart() {
                unit.string(this.service.getData())
                    .is('test');
                done();
            }
        }

        Hapiness.bootstrap(ModuleTest);
    }

    @test('HapinessModule - SubModule')
    test3(done) {

        @Injectable()
        class Service1 {
            getData() {
                return 'test';
            }
        }

        @Injectable()
        class Service2 {
            getData() {
                return '123';
            }
        }

        @HapinessModule({
            version: '1.0.0',
            providers: [ Service2 ]
        })
        class SubSubModule implements OnRegister {

            constructor(private service: Service2) {}

            onRegister() {
                unit.string(this.service.getData()).is('123');
            }
        }

        @HapinessModule({
            version: '1.0.0',
            providers: [ Service2 ],
            exports: [ Service2 ],
            imports: [{ module: SubSubModule, providers: [] }]
        })
        class SubModule implements OnRegister {

            constructor(private service: Service2) {}

            onRegister() {
                unit.string(this.service.getData()).is('123');
            }
        }

        @HapinessModule({
            version: '1.0.0',
            providers: [ Service1 ],
            imports: [ SubModule ]
        })
        class ModuleTest implements OnStart {

            constructor(
                private service1: Service1,
                private service2: Service2
            ) {}

            onStart() {
                unit.string(this.service1.getData() + this.service2.getData())
                    .is('test123');
                done();
            }
        }

        Hapiness.bootstrap(ModuleTest);
    }

    @test('HapinessModule - Libs')
    test4(done) {

        @Injectable()
        class Service1 {
            getData() {
                return 'test';
            }
        }

        @Lib()
        class LibTest {
            constructor(private service: Service1) {
                unit.string(this.service.getData())
                    .is('test');
                done();
            }
        }

        @HapinessModule({
            version: '1.0.0',
            providers: [ Service1 ],
            declarations: [ LibTest ]
        })
        class ModuleTest {}

        Hapiness.bootstrap(ModuleTest);
    }

    @test('HapinessModule - Error')
    test5(done) {

        @HapinessModule({
            version: '1.0.0'
        })
        class ModuleTest {

            onStart() {
                return Observable.create(observer => {
                    observer.error(new Error('error'));
                    observer.complete();
                });
            }
        }

        Hapiness.bootstrap(ModuleTest).catch(_ => {
                unit.object(_)
                    .isInstanceOf(Error)
                    .hasProperty('message', 'error');
                done();
            });
    }

    @test('HapinessModule - Provide parent config to sub module')
    test6(done) {

        const TOKEN = new InjectionToken('token');

        @HapinessModule({
            version: '1.0.0'
        })
        class SubModuleTest {

            constructor(@Inject(TOKEN) private config) {}

            onRegister() {
                unit.must(this.config.test)
                    .is(true);
                done();
            }
        }

        @HapinessModule({
            version: '1.0.0',
            imports: [ SubModuleTest ]
        })
        class ModuleTest {

            static setConfig(config) {
                return {
                    module: ModuleTest,
                    providers: [
                        { provide: TOKEN, useValue: config }
                    ]
                }
            }
        }

        @HapinessModule({
            version: '1.0.0',
            imports: [ ModuleTest.setConfig({ test: true }) ]
        })
        class AppModuleTest {}

        Hapiness.bootstrap(AppModuleTest);
    }
}
