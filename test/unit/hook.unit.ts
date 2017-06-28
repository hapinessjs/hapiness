import { test, suite } from 'mocha-typescript';
import * as unit from 'unit.js';
import { Observable } from 'rxjs/Observable';
import { HookManager } from '../../src/core';

@suite('Unit - Hook')
class Hook {

    @test('hasLifecycleHook')
    test1() {
        class TestToken {
            onTest() {}
        }

        unit.must(HookManager.hasLifecycleHook('onTest', TestToken))
            .is(true);

        unit.must(HookManager.hasLifecycleHook('NuLl', TestToken))
            .is(false);

        unit.must(HookManager.hasLifecycleHook(null, null))
            .is(false);
    }

    @test('triggerHook - return abc')
    test2(done) {
        class TestToken {
            onTest() {
                return 'abc';
            }
        }
        HookManager.triggerHook('onTest', TestToken, new TestToken())
            .subscribe(_ => {
                unit.must(_).equal('abc');
                done();
            });
    }

    @test('triggerHook - return Observable abc')
    test3(done) {
        class TestToken {
            onTest() {
                return Observable.of('abc');
            }
        }
        HookManager.triggerHook('onTest', TestToken, new TestToken())
            .subscribe(_ => {
                unit.must(_).equal('abc');
                done();
            });
    }

    @test('triggerHook - hook does not exist - error')
    test4(done) {
        class TestToken {}
        HookManager.triggerHook('onTest', TestToken, new TestToken(), null, true)
            .subscribe(_ => {}, _ => {
                unit.object(_)
                    .isInstanceOf(Error)
                    .hasProperty('message', 'Hook missing onTest on TestToken');
                done();
            });
    }

    @test('triggerHook - hook does not exist - no error')
    test5(done) {
        class TestToken {}
        HookManager.triggerHook('onTest', TestToken, new TestToken())
            .subscribe(_ => {
                unit.must(_).equal(undefined);
                done();
            });
    }

    @test('triggerHook - no token/instance')
    test6() {
        unit.error(HookManager.triggerHook)
            .is(new Error('Cannot trigger without token/instance'));
    }
}
