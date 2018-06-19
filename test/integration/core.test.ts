import { suite, test } from 'mocha-typescript';
import { Hapiness, HapinessModule, OnStart, OnRegister, Lib, Injectable, ExtensionShutdownPriority } from '../../src/core';
import * as unit from 'unit.js';
import { Observable } from 'rxjs/Observable';

@suite('Integration - Core')
export class ModuleTestSuite {

    @test('Bootstrap - Simple module')
    testBootstrap1(done) {

        @HapinessModule({
            version: ''
        })
        class Module1 implements OnStart {

            onStart() {
                done();
            }

        }

        Hapiness
            .bootstrap(Module1);

    }

    @test('Bootstrap - Module with embedded module')
    testBootstrap2(done) {
        let state = 0;

        @HapinessModule({
            version: ''
        })
        class Module1 implements OnRegister {

            onRegister() {
                state = 1;
            }

        }

        @HapinessModule({
            version: '',
            imports: [ Module1 ]
        })
        class Module2 implements OnStart {

            onStart() {
                unit
                    .value(state)
                    .is(1);
                done();
            }

        }

        Hapiness
            .bootstrap(Module2);

    }

    @test('Bootstrap - Module with Lib')
    testBootstrap3(done) {

        @Lib()
        class Lib1 {
            constructor() {
                done();
            }
        }

        @HapinessModule({
            version: '',
            declarations: [ Lib1 ]
        })
        class Module1 {}

        Hapiness
            .bootstrap(Module1);

    }

    @test('Bootstrap - Module with Provider')
    testBootstrap4(done) {

        @Injectable()
        class Provider1 {
            value() {
                return 123;
            }
        }

        @HapinessModule({
            version: '',
            providers: [ Provider1 ]
        })
        class Module1 implements OnStart {
            constructor(private provider1: Provider1) {}
            onStart() {
                unit
                    .number(this.provider1.value())
                    .is(123);
                done();
            }
        }

        Hapiness
            .bootstrap(Module1);

    }

    @test('Bootstrap - Module with Lib and Provider')
    testBootstrap5(done) {

        @Injectable()
        class Provider1 {
            value() {
                return 123;
            }
        }

        @Lib()
        class Lib1 {
            constructor(provider1: Provider1) {
                unit
                    .number(provider1.value())
                    .is(123);
            }
        }

        @HapinessModule({
            version: '',
            declarations: [ Lib1 ],
            providers: [ Provider1 ]
        })
        class Module1 implements OnStart {
            constructor(private provider1: Provider1) {}
            onStart() {
                unit
                    .number(this.provider1.value())
                    .is(123);
                done();
            }
        }

        Hapiness
            .bootstrap(Module1);

    }

    @test('Bootstrap - Error thrown')
    testBootstrap6(done) {

        @HapinessModule({
            version: ''
        })
        class Module1 implements OnStart {

            onStart() {
                throw new Error('Oops');
            }

        }

        Hapiness
            .bootstrap(Module1)
            .catch(_ => {
                unit
                    .object(_)
                    .isInstanceOf(Error)
                    .hasProperty('message', 'Oops');
                done();
            });

    }

    @test('Bootstrap - Extension timeout')
    testBootstrap7(done) {

        class TestExtension {
            onExtensionLoad() {
                return Observable
                    .of('')
                    .delay(500);
            }
        }

        @HapinessModule({
            version: ''
        })
        class Module1 implements OnStart {

            onStart() {
                throw new Error('Oops');
            }

        }

        Hapiness
            .bootstrap(Module1, [ TestExtension ], { extensionTimeout: 100 })
            .catch(_ => {
                unit
                    .object(_)
                    .isInstanceOf(Error)
                    .hasProperty('message', '[TestExtension] Timeout has occurred');

                done();
            });

    }

    @test('Bootstrap - Extension timeout call onShutdown on first extension')
    testBootstrap8(done) {

        let enterred = false;

        class TestExtension1 {
            onExtensionLoad() {
                return Observable.of({
                    value: 'test',
                    instance: this,
                    token: TestExtension1
                });
            }

            onShutdown() {
                enterred = true;
                return {
                    priority: ExtensionShutdownPriority.NORMAL,
                    resolver: Observable.of(true)
                };
            }
        }

        class TestExtension2 {
            onExtensionLoad() {
                return Observable
                    .of('')
                    .delay(500);
            }
        }

        @HapinessModule({
            version: ''
        })
        class Module1 implements OnStart {

            onStart() {
                throw new Error('Oops');
            }

        }

        Hapiness
            .bootstrap(Module1, [ TestExtension1, TestExtension2 ], { extensionTimeout: 100 })
            .catch(_ => {
                unit
                    .object(_)
                    .isInstanceOf(Error)
                    .hasProperty('message', '[TestExtension2] Timeout has occurred');

                unit.bool(enterred).isTrue();

                done();
            });

    }
}
