import * as util from 'util';
import { Injectable } from '../../src/core';
import { suite, test } from 'mocha-typescript';
import { HookManager } from '../../src/core';
import { Observable } from 'rxjs';
import * as unit from 'unit.js';

import { EmptyProvider } from './mocks';

@suite('Unit - Hook')
class ModuleTestSuite {

    @test('hasLifecycleHook - provide hook and token and must return true')
    testHasLifecycleHook1() {

        class MyToken {
            test() {}
        }

        unit
            .bool(HookManager.hasLifecycleHook('test', MyToken))
            .isTrue();
    }

    @test('hasLifecycleHook - provide hook and token and must return false')
    testHasLifecycleHook2() {

        class MyToken {}

        unit
            .bool(HookManager.hasLifecycleHook('test', MyToken))
            .isFalse();
    }

    @test('triggerHook - provide hook, token and instance and must return Observable hook value')
    testTriggerHook1() {

        class MyToken {
            test() { return 1 }
        }

        HookManager
            .triggerHook('test', MyToken, new MyToken())
            .subscribe(
                _ =>
                    unit
                        .value(_)
                        .is(1)
            );
    }

    @test('triggerHook - provide hook, token and instance and must return Observable')
    testTriggerHook2() {

        class MyToken {
            test() { return Observable.of(1) }
        }

        HookManager
            .triggerHook('test', MyToken, new MyToken())
            .subscribe(
                _ =>
                    unit
                        .value(_)
                        .is(1)
            );
    }

    @test('triggerHook - provide hook, token and instance and must return void')
    testTriggerHook3() {

        class MyToken {
            test() {}
        }

        HookManager
            .triggerHook('test', MyToken, new MyToken())
            .isEmpty()
            .subscribe(
                _ =>
                    unit
                        .bool(_)
                        .isTrue()
            );
    }

    @test('triggerHook - provide hook, token and instance without hook and must throw error')
    testTriggerHook4() {

        class MyToken {}

        HookManager
            .triggerHook('test', MyToken, new MyToken(), null, true)
            .subscribe(
                null,
                _ =>
                    unit
                        .object(_)
                        .isInstanceOf(Error)
                        .hasProperty('message', 'Hook missing test on MyToken')
            );
    }

    @test('triggerHook - provide hook, token and instance without hook and must not throw error')
    testTriggerHook5() {

        class MyToken {}

        HookManager
            .triggerHook('test', MyToken, new MyToken())
            .isEmpty()
            .subscribe(
                _ =>
                    unit
                        .bool(_)
                        .isTrue()
            );
    }
}
