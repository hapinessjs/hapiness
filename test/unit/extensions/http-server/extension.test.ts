import { suite, test } from 'mocha-typescript';
import { HttpServerExt, LifecycleManager } from '../../../../src/extensions/http-server';
import { ModuleManager } from '../../../../src/core';
import { Observable } from 'rxjs';
import * as unit from 'unit.js';

import * as Hapi from 'hapi';

import { coreModule, EmptyModule } from '../../mocks';

@suite('Unit - HttpServer - Extension')
class ModuleTestSuite {

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

        class EmptyModule2 {}
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
            .stub(extInstance, 'instantiateLifecycle')
            .returns(Observable.of(null));

        extInstance
            .onModuleInstantiated(coreModule, <any>server)
            .subscribe();

        stub1.parent.restore();
        stub2.restore();
        stub3.restore();
        stub4.restore();
    }
}
