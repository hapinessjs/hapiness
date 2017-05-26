import { Observable } from 'rxjs/Rx';
import { DependencyInjection } from '../../src/core/di';
import { eRouteLifecycleHooks, RouteLifecycleHook } from '../../src/route/hook';
import { test, suite } from 'mocha-typescript';
import * as unit from 'unit.js';
import * as Boom from 'boom';
import { Route, OnGet } from '../../src';
import { TestRoute } from './common/module.mock';

@suite('Route Hooks')
class RouteHooks {

    @test('Hook exists')
    testHookexists() {

        const result1 = RouteLifecycleHook.hasLifecycleHook(eRouteLifecycleHooks.OnGet, TestRoute);
        const result2 = RouteLifecycleHook.hasLifecycleHook(eRouteLifecycleHooks.OnPut, TestRoute);
        const result3 = RouteLifecycleHook.hasLifecycleHook(eRouteLifecycleHooks.OnPatch, TestRoute);
        const result4 = RouteLifecycleHook.hasLifecycleHook(eRouteLifecycleHooks.OnOptions, TestRoute);
        const result5 = RouteLifecycleHook.hasLifecycleHook(eRouteLifecycleHooks.OnDelete, TestRoute);
        unit.must(result1 && result2 && result3 && result4 && result5).equal(true);

    }

    @test('Hook is not implemented')
    testHookNotImpl() {

        const result1 = RouteLifecycleHook.hasLifecycleHook(eRouteLifecycleHooks.OnPost, TestRoute);
        unit.must(result1).equal(false);

    }

    @test('Hook does not exist')
    testHookDoesnotExist() {

        unit.exception(() => unit.when(() => RouteLifecycleHook.hasLifecycleHook(99, TestRoute)))
            .is(Boom.create(500, 'Hook does not exist'));

    }

    @test('Hook enum method')
    testHookEnumMethod() {

        unit.must(RouteLifecycleHook.enumByMethod('get'))
            .is(eRouteLifecycleHooks.OnGet);
        unit.must(RouteLifecycleHook.enumByMethod('post'))
            .is(eRouteLifecycleHooks.OnPost);
        unit.must(RouteLifecycleHook.enumByMethod('put'))
            .is(eRouteLifecycleHooks.OnPut);
        unit.must(RouteLifecycleHook.enumByMethod('patch'))
            .is(eRouteLifecycleHooks.OnPatch);
        unit.must(RouteLifecycleHook.enumByMethod('options'))
            .is(eRouteLifecycleHooks.OnOptions);
        unit.must(RouteLifecycleHook.enumByMethod('delete'))
            .is(eRouteLifecycleHooks.OnDelete);

        unit.exception(() => unit.when(() => RouteLifecycleHook.enumByMethod('toto')))
            .is(Boom.create(500, 'Method does not exist'));

    }

    @test('Trigger hook')
    testTriggerHook(done) {

        @Route({
            method: 'get',
            path: '/test'
        })
        class MyRoute implements OnGet {
            onGet() {}
        }

        const instance = DependencyInjection.instantiateComponent(MyRoute, null);
        RouteLifecycleHook.triggerHook(eRouteLifecycleHooks.OnGet, MyRoute, instance, [])
            .subscribe(data => {
                done();
            });

    }

    @test('Trigger hook - Error')
    testTriggerHookErr() {

        @Route({
            method: 'get',
            path: '/test'
        })
        class MyRoute implements OnGet {
            onGet() {}
        }

        const instance = DependencyInjection.instantiateComponent(MyRoute, null);

        unit.exception(() => unit.when(() => RouteLifecycleHook.triggerHook(eRouteLifecycleHooks.OnPatch, MyRoute, instance, [])))
            .is(Boom.create(500, 'onPatch is not implemented in MyRoute'));

    }

    @test('Trigger hook - Observable')
    testTriggerHookObs(done) {

        @Route({
            method: 'get',
            path: '/test'
        })
        class MyRoute implements OnGet {
            onGet() {
                return Observable.create(obs => {
                    obs.next('toto');
                    obs.complete();
                });
            }
        }

        const instance = DependencyInjection.instantiateComponent(MyRoute, null);
        RouteLifecycleHook.triggerHook(eRouteLifecycleHooks.OnGet, MyRoute, instance, [])
            .subscribe(data => {
                unit.must(data).equal('toto');
                done();
            });

    }

}
