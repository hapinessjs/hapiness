import { OnGet, OnPostAuth, OnPostHandler, OnPreAuth, OnPreHandler, OnPreResponse } from '../../src/route/hook';
import { LifecycleManager, OnEvent } from '../../src/core/lifecycle';
import { HapinessModule } from '../../src/core/decorators';
import { Hapiness, Lifecycle, Route } from '../../src/core';
import { OnError } from '../../src/module';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import { test, suite, only } from 'mocha-typescript';
import * as unit from 'unit.js';

const events = ['onRequest', 'onPreAuth', 'onPostAuth', 'onPreHandler', 'onPostHandler', 'onPreResponse'];

@suite('Lifecycle')
class LifecycleSuite {

    @test('Lifecycle component')
    testLCComponent(done) {
        @Lifecycle({
            event: 'onPreAuth'
        })
        class LC implements OnEvent {
            onEvent(request, reply) {
                reply.continue();
                done();
            }
        }

        @Route({ method: 'get', path: '/test' })
        class MYRoute implements OnGet, OnPreAuth, OnPostAuth, OnPreHandler, OnPostHandler, OnPreResponse {
            onGet(req, rpl) { rpl(); }
            onPreAuth(req, rpl) { rpl.continue() }
            onPostAuth(req, rpl) { rpl.continue() }
            onPreHandler(req, rpl) { rpl.continue() }
            onPostHandler(req, rpl) { rpl.continue() }
            onPreResponse(req, rpl) { rpl.continue() }
        }

        @HapinessModule({
            version: 'xx',
            options: {},
            declarations: [ MYRoute ]
        })
        class SubMod {}

        @HapinessModule({
            version: 'xx',
            options: { host: '0.0.0.0', port: 4488 },
            imports: [ SubMod ],
            declarations: [ LC ]
        })
        class Mod {}
        Hapiness.bootstrap(Mod).then(_ => {
            Hapiness['mainModule'].server.inject('/test', res => Hapiness.kill().subscribe(__ => {}));
        });

    }

    @test('Lifecycle component - no route found')
    testLCComponentNoRoute(done) {
        @Lifecycle({
            event: 'onPreAuth'
        })
        class LC implements OnEvent {
            onEvent(request, reply) {
                reply.continue();
                done();
            }
        }

        @Route({ method: 'get', path: '/test' })
        class MYRoute implements OnGet {
            onGet(req, rpl) { rpl(); }
        }

        @HapinessModule({
            version: 'xx',
            options: { host: '0.0.0.0', port: 4488 },
            declarations: [ MYRoute, LC ]
        })
        class Mod {}
        Hapiness.bootstrap(Mod).then(_ => {
            Hapiness['mainModule'].server.inject('/noroute', res => Hapiness.kill().subscribe(__ => done()));
        });

    }

    @test('Lifecycle component - error')
    testLCComponentError(done) {
        @Lifecycle({
            event: 'onPreAuth'
        })
        class LC {}

        @Route({ method: 'get', path: '/test' })
        class MYRoute {
            onGet(req, rpl) { rpl(); }
        }

        @HapinessModule({
            version: 'xx',
            options: { host: '0.0.0.0', port: 4499 },
            declarations: [ MYRoute, LC ]
        })
        class Mod {}
        Hapiness.bootstrap(Mod).then(_ => {
            Hapiness['mainModule'].server.inject('/test', res => Hapiness.kill().subscribe(__ => {}))
        }).catch(err => {
            unit.must(err.message).equal('Lifecycle component without onEvent hook');
            done();
        });

    }

    @test('Lifecycle component - trigger without hook')
    testTrigger() {
        @Lifecycle({
            event: 'onPreAuth'
        })
        class LC {}
        LifecycleManager.triggerHook(LC, new LC(), []);
    }

    @test('Lifecycle component - test without routes provided')
    testRouteLC() {
        LifecycleManager.routeLifecycle(<any>{
            server: {
                ext: (ev, cb) => {
                    cb(<any>{ route: {} }, <any>{ continue: _ => {} });
                }
            },
            routes: []
        });
    }
}
