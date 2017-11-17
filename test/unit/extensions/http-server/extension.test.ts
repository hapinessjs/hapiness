import { suite, test } from 'mocha-typescript';
import { HttpServerExt, LifecycleManager } from '../../../../src/extensions/http-server';
import { HookManager, ModuleManager } from '../../../../src/core';
import { Observable } from 'rxjs';
import * as unit from 'unit.js';

import * as Hapi from 'hapi';

import { coreModule, EmptyModule } from '../../mocks';

@suite('Unit - HttpServer - Extension')
export class ModuleTestSuite {

    @test('onExtensionLoad - provide module and config and must return Observable of Extension')
    testOnExtensionLoad1() {

        class ServerMock {
            connection(config) {
                unit
                    .object(config)
                    .is({ options: undefined });
            }
        }

        const uglyHapi = <any>Hapi;
        const tmpServer = uglyHapi.Server;
        uglyHapi['Server'] = ServerMock;

        const extInstance = new HttpServerExt();
        extInstance
            .onExtensionLoad(coreModule, <any>{ options: {} })
            .subscribe(
                _ => {
                    unit
                        .value(_.token)
                        .is(HttpServerExt);
                    unit
                        .value(_.instance)
                        .is(extInstance);
                    unit
                        .value(_.value)
                        .isInstanceOf(ServerMock);
                }
            );

        uglyHapi['Server'] = tmpServer;
    }

    @test('onModuleInstantiated - provide module and server and must return Observable')
    testOnModuleInstantiated1() {

        class EmptyModule2 {
        }

        const getModulesRes = [
            { token: EmptyModule },
            { token: EmptyModule2 }
        ];
        const extInstance = new HttpServerExt();
        const server = { start: () => Promise.resolve() }

        const stub1 = unit
            .stub(ModuleManager, 'getModules')
            .withArgs(coreModule)
            .returns(getModulesRes);
        const stub2 = unit
            .stub(extInstance, 'registerPlugin');
        stub2
            .withArgs(getModulesRes[0], server)
            .returns([{}]);
        stub2
            .withArgs(getModulesRes[1], server)
            .returns([{}, {}]);
        const stub3 = unit
            .stub(LifecycleManager, 'routeLifecycle');
        const stub4 = unit
            .stub(extInstance, 'instantiateLifecycle');
        stub4
            .withArgs(getModulesRes[0], server)
            .returns(Observable.of(getModulesRes[0]));
        stub4
            .withArgs(getModulesRes[1], server)
            .returns(Observable.of(getModulesRes[1]));

        extInstance
            .onModuleInstantiated(coreModule, <any>server)
            .subscribe();

        stub1.parent.restore();
        stub2.restore();
        stub3.restore();
        stub4.restore();
    }

    @test('httpHandler - provide request, reply and route and must reply 200')
    testHttpHandler1() {

        const request = {
            method: 'get'
        };
        const reply = res => {
            unit
                .value(res)
                .is('toto');
            return {
                code: function (c) {
                    unit
                        .value(c)
                        .is(200);
                    return this;
                },
                headers: {}
            };
        };
        const stub4 = unit
            .stub(HookManager, 'triggerHook')
            .returns(Observable.of('toto'));

        const extInstance = new HttpServerExt();
        extInstance['httpHandler'](<any>request, <any>reply, <any>{});

        stub4.restore();
    }

    @test('httpHandler - provide request, reply and route and must reply 201')
    testHttpHandler2() {

        const request = {
            method: 'get'
        };
        const reply = res => {
            unit
                .value(res)
                .is('abc');
            return {
                code: function (c) {
                    unit
                        .value(c)
                        .is(201);
                    return this;
                },
                headers: {}
            };
        };
        const stub4 = unit
            .stub(HookManager, 'triggerHook')
            .returns(Observable.of({ response: 'abc', statusCode: 201 }));

        const extInstance = new HttpServerExt();
        extInstance['httpHandler'](<any>request, <any>reply, <any>{});

        stub4.restore();
    }

    @test('httpHandler - provide request, reply and route and must reply 204')
    testHttpHandler3() {

        const request = {
            method: 'get'
        };
        const reply = res => {
            unit
                .value(res)
                .is(null);
            return {
                code: function (c) {
                    unit
                        .value(c)
                        .is(204);
                    return this;
                },
                headers: {}
            };
        };
        const stub4 = unit
            .stub(HookManager, 'triggerHook')
            .returns(Observable.of(null));

        const extInstance = new HttpServerExt();
        extInstance['httpHandler'](<any>request, <any>reply, <any>{});

        stub4.restore();
    }
}
