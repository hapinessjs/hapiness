import { OnExtensionLoad } from '../../src/core';
import { Hapiness } from '../../src/core/bootstrap';
import { HapinessModule, Inject, Injectable, InjectionToken } from '../../src/core/decorators';
import { HookManager } from '../../src/core/hook';
import { CoreModuleWithProviders, ModuleManager } from '../../src/core/module';
import { HttpServerExt } from '../../src/extensions/http-server';
import { Lifecycle, Route } from '../../src/extensions/http-server/decorators';
import { SocketServerExt } from '../../src/extensions/socket-server/extension';
import { Optional } from '../../src/externals/injection-js';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import { only, suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { RouteConfiguration, Server } from 'hapi';

@only
@suite('Unit - Bootstrap')
class SuiteBoostrap {

    @test('bootstrap - no module')
    test1(done) {

        Hapiness.bootstrap(null)
        .catch(_ => {
            unit.object(_)
                .isInstanceOf(Error)
                .hasProperty('message', 'Please provide a module to bootstrap');
            done();
        });
    }

    @test('bootstrap - wrong module')
    test2(done) {

        Hapiness.bootstrap(<any>'test')
        .catch(_ => {
            unit.object(_)
                .isInstanceOf(Error)
                .hasProperty('message', 'Wrong module to bootstrap');
            done();
        });
    }

    @test('bootstrap - no extensions')
    test3(done) {

        class TestModule {}
        const cm = {
            token: TestModule,
            name: 'TestModule',
            version: ''
        }
        const cmi = Object.assign({ instance: new TestModule() }, cm);

        const mocks = [];
        mocks.push(unit.stub(ModuleManager, 'resolveModule')
            .returns(cm));
        mocks.push(unit.stub(ModuleManager, 'instantiateModule')
            .returns(Observable.create(observer => {
                observer.next(cmi);
                observer.complete();
            })));
        mocks.push(unit.stub(ModuleManager, 'getModules')
            .returns(Observable.create(observer => {
                observer.next([ cmi ]);
                observer.complete();
            })));
        mocks.push(unit.stub(HookManager, 'hasLifecycleHook')
            .returns(false));
        mocks.push(unit.stub(HookManager, 'triggerHook')
            .returns(Observable.create(observer => {
                observer.next();
                observer.complete();
            })));

        Hapiness.bootstrap(TestModule)
            .then(_ => {
                unit.must(Hapiness['module']).equal(cmi);
                unit.array(Hapiness['extensions']).is([]);
                mocks.forEach(__ => __.restore());
                done();
            });
    }

    @test('bootstrap - with extension')
    test4(done) {

        class TestModule {}
        class TestExt {}
        const cm = {
            token: TestModule,
            name: 'TestModule',
            version: ''
        }
        const cmi = Object.assign({ instance: new TestModule() }, cm);
        const cmic = Object.assign({ parent: cmi }, cmi);

        const mocks = [];
        mocks.push(unit.stub(ModuleManager, 'resolveModule')
            .returns(cm));
        mocks.push(unit.stub(ModuleManager, 'instantiateModule')
            .returns(Observable.create(observer => {
                observer.next(cmi);
                observer.complete();
            })));
        mocks.push(unit.stub(ModuleManager, 'getModules')
            .returns(Observable.create(observer => {
                observer.next([ cmi, cmic ]);
                observer.complete();
            })));
        mocks.push(unit.stub(HookManager, 'hasLifecycleHook')
            .returns(true));
        mocks.push(unit.stub(HookManager, 'triggerHook')
            .returns(Observable.create(observer => {
                observer.next();
                observer.complete();
            })));

        mocks.push(unit.stub(Hapiness, 'loadExtention')
            .returns(Observable.create(observer => {
                observer.next({
                    token: TestExt,
                    instance: new TestExt(),
                    value: {}
                });
                observer.complete();
            })));

        Hapiness.bootstrap(TestModule, [ TestExt ])
            .then(_ => {
                unit.must(Hapiness['module']).equal(cmi);
                unit.array(Hapiness['extensions']).isNotEmpty();
                mocks.forEach(__ => __.restore());
                done();
            });
    }

    @test('toExtensionWithConfig')
    test5() {

        class Token {}
        unit.object(Hapiness['toExtensionWithConfig'](Token))
            .is({
                token: Token,
                config: {}
            });

        unit.object(Hapiness['toExtensionWithConfig']({
                token: Token,
                config: {
                    test: true
                }
            }))
            .is({
                token: Token,
                config: {
                    test: true
                }
            });
    }

    @test('loadExtention')
    test6(done) {
        class Token {
            onExtensionLoad() {
                return Observable.create(observer => {
                    observer.next(true);
                    observer.complete();
                });
            }
        }
        Hapiness['loadExtention']({
            token: Token,
            config: {}
        }).subscribe(_ => {
            unit.must(_).equal(true);
            done();
        });
    }
}
