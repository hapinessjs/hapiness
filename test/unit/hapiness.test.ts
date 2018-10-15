import { suite, test } from 'mocha-typescript';
import { of, throwError } from 'rxjs';
import * as unit from 'unit.js';
import { errorHandler, Hapiness, HookManager, ModuleManager } from '../../src/core';

import { coreModule, EmptyModule } from './mocks';

@suite('Unit - Hapiness')
export class TestSuite {

    @test('bootstrap - provide module and must resolve')
    testBootstrap1(done) {

        const stub1 = unit
            .stub(Hapiness, 'checkArg')
            .withArgs(EmptyModule)
            .returns(of(EmptyModule));
        const stub2 = unit
            .stub(ModuleManager, 'resolve')
            .withArgs(EmptyModule)
            .returns(of(coreModule));
        const stub3 = unit
            .stub(Hapiness, 'loadExtensions')
            .withArgs(undefined, coreModule)
            .returns(of([]));

        Hapiness
            .bootstrap(EmptyModule)
            .then(_ => {
                stub1.parent.restore();
                stub2.parent.restore();
                stub3.parent.restore();
                done();
            });
    }

    @test('bootstrap - provide module and must reject')
    testBootstrap2(done) {

        const stub1 = unit
            .stub(Hapiness, 'checkArg')
            .withArgs(EmptyModule)
            .returns(throwError(new Error('Oops')));

        const stub2 = unit
            .stub(Hapiness, 'shutdown')
            .returns(of(false));

        Hapiness
            .bootstrap(EmptyModule)
            .catch(_ => {
                unit
                    .object(_)
                    .isInstanceOf(Error)
                    .hasProperty('message', 'Oops');

                unit.number(stub2.callCount).is(1);

                stub1.parent.restore();
                stub2.restore();

                done();
            });
    }

    @test('loadExtensions - provide extensions and module and must call instantiateModule')
    testLoadExtensions1() {

        class MyExt {
        }

        const extwc = { token: MyExt, config: {} };
        const ext = { value: 123, instance: {}, token: MyExt };

        const stub1 = unit
            .stub(Hapiness, 'toExtensionWithConfig')
            .withArgs(MyExt)
            .returns(extwc);
        const stub2 = unit
            .stub(Hapiness, 'loadExtention')
            .withArgs(extwc, coreModule)
            .returns(of(ext));
        const stub3 = unit
            .stub(Hapiness, 'instantiateModule')
            .withArgs([ ext ], coreModule)
            .returns(of(null));

        Hapiness[ 'loadExtensions' ]([ MyExt, null ], coreModule, {})
            .subscribe();

        stub1.parent.restore();
        stub2.parent.restore();
        stub3.parent.restore();

    }

    @test('instantiateModule - provide loaded extensions and module and must call callHooks')
    testInstantiateModule1() {

        class MyExt {
        }

        const ext = { value: 123, instance: {}, token: MyExt };

        const stub1 = unit
            .stub(ModuleManager, 'instantiate')
            .withArgs(coreModule, [ { provide: MyExt, useValue: 123 } ])
            .returns(of(coreModule));
        const stub2 = unit
            .stub(Hapiness, 'moduleInstantiated')
            .withArgs(ext, coreModule)
            .returns(of(null));
        const stub3 = unit
            .stub(Hapiness, 'callRegister')
            .withArgs(coreModule)
            .returns(of(coreModule));
        const stub4 = unit
            .stub(Hapiness, 'callStart')
            .withArgs(coreModule)
            .returns(of(null));

        Hapiness[ 'instantiateModule' ]([ ext ], coreModule, {})
            .subscribe();

        stub1.parent.restore();
        stub2.parent.restore();
        stub3.parent.restore();
        stub4.parent.restore();

    }

    @test('callRegister - provide module and must call hooks')
    testCallHooks1() {

        class EmptyModule2 {
            onRegister() {
            }
        }

        const module = Object.assign({ instance: new EmptyModule() }, coreModule);

        const getModulesRes = [
            module,
            { token: EmptyModule2, instance: new EmptyModule2() }
        ];

        const stub1 = unit
            .stub(ModuleManager, 'getModules')
            .withArgs(module)
            .returns(getModulesRes);
        const stub2 = unit
            .stub(HookManager, 'hasLifecycleHook')
            .withArgs('onRegister', EmptyModule2)
            .returns(true);
        const stub3 = unit
            .stub(HookManager, 'triggerHook')
            .returns(of(module))
            .withArgs('onRegister', EmptyModule2, getModulesRes[ 1 ].instance)
            .returns(of(module));

        Hapiness[ 'callRegister' ](module)
            .subscribe();

        stub1.parent.restore();
        stub2.parent.restore();
        stub3.parent.restore();

    }

    @test('checkArg - provide module and must not throw error')
    testCheckArg1(done) {

        Hapiness[ 'checkArg' ](EmptyModule)
            .subscribe(
                _ => done()
            );

    }

    @test('checkArg - dont provide module and must throw error')
    testCheckArg2() {

        Hapiness[ 'checkArg' ](null)
            .subscribe(
                null,
                _ =>
                    unit
                        .object(_)
                        .isInstanceOf(Error)
                        .hasProperty('message', 'Bootstrap failed: no module provided')
            );

    }

    @test('checkArg - provide wrong module and must throw error')
    testCheckArg3() {

        Hapiness[ 'checkArg' ](<any>'module')
            .subscribe(
                null,
                _ =>
                    unit
                        .object(_)
                        .isInstanceOf(Error)
                        .hasProperty('message', 'Bootstrap failed: module must be a function/class')
            );

    }

    @test('toExtensionWithConfig - provide extension and must return ExtensionWithConfig')
    testToExtensionWithConfig1() {

        class MyExt {
        }

        unit
            .object(Hapiness[ 'toExtensionWithConfig' ](MyExt))
            .is({ token: MyExt, config: {} });

        unit
            .object(Hapiness[ 'toExtensionWithConfig' ]({ token: MyExt, config: { test: 1 } }))
            .is({ token: MyExt, config: { test: 1 } });

    }

    @test('loadExtention - provide extension and module and must return Extension')
    testLoadExtention1() {

        class MyExt {
        }

        const ext = { token: MyExt, config: {} };
        const instance = new MyExt();

        const stub1 = unit
            .stub(Reflect, 'construct')
            .returns(instance);
        const stub2 = unit
            .stub(HookManager, 'triggerHook')
            .withArgs('onExtensionLoad', MyExt, instance, [ coreModule, {} ])
            .returns(of({}));

        Hapiness[ 'loadExtention' ](ext, coreModule)
            .subscribe(
                _ =>
                    unit
                        .value(_)
                        .is({})
            );

        stub1.restore();
        stub2.parent.restore();

    }

    @test('moduleInstantiated - provide extension and module and must return Observable')
    testModuleInstantiated1() {

        class MyExt {
        }

        const ext = { token: MyExt, instance: new MyExt(), value: 123 };

        const stub1 = unit
            .stub(HookManager, 'triggerHook')
            .withArgs('onModuleInstantiated', ext.token, ext.instance, [ coreModule, ext.value ])
            .returns(of(null));

        Hapiness[ 'moduleInstantiated' ](ext, coreModule)
            .subscribe(
                _ =>
                    unit
                        .value(_)
                        .is(null)
            );

        stub1.parent.restore();

    }

    @test('errorHandler - provide Error and must trigger onError')
    testErrorHandler1() {

        class ModuleError {
            onError() {
            }
        }

        const module = { token: ModuleError, instance: new ModuleError() };
        const error = new Error('Oops');

        const stub1 = unit
            .stub(HookManager, 'hasLifecycleHook')
            .returns(true);
        const stub2 = unit
            .stub(HookManager, 'triggerHook')
            .returns(of(null));

        Hapiness[ 'module' ] = <any>module;
        errorHandler(error);
        stub1.restore();
        stub2.restore();
        Hapiness[ 'module' ] = undefined;

    }

    @test('errorHandler - provide Error and must not trigger onError')
    testErrorHandler2() {

        class ModuleError {
            onError() {
            }
        }

        const module = { token: ModuleError, instance: new ModuleError() };
        const error = new Error('Oops');

        const stub1 = unit
            .stub(HookManager, 'hasLifecycleHook')
            .returns(false);
        const stub2 = unit
            .stub(console, 'error')
            .withArgs(error)
            .returns(null);

        Hapiness[ 'module' ] = <any>module;
        errorHandler(error);
        stub1.restore();
        stub2.parent.restore();
        Hapiness[ 'module' ] = undefined;

    }

}
