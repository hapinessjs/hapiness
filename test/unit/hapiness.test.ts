import * as util from 'util';
import { Injectable } from '../../src/core';
import { suite, test } from 'mocha-typescript';
import { Hapiness, ModuleManager } from '../../src/core';
import { Observable } from 'rxjs';
import * as unit from 'unit.js';

import { EmptyModule, coreModule } from './mocks';

@suite('Unit - Hapiness')
class TestSuite {

    @test('bootstrap - provide module and must resolve')
    testBootstrap1(done) {

        const stub1 = unit
            .stub(Hapiness, 'checkArg')
            .withArgs(EmptyModule)
            .returns(Observable.of(EmptyModule));
        const stub2 = unit
            .stub(ModuleManager, 'resolve')
            .withArgs(EmptyModule)
            .returns(Observable.of(coreModule));
        const stub3 = unit
            .stub(Hapiness, 'loadExtensions')
            .withArgs(undefined, coreModule)
            .returns(Observable.of([]));

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
            .returns(Observable.throw(new Error('Oops')));

        Hapiness
            .bootstrap(EmptyModule)
            .catch(_ => {
                unit
                    .object(_)
                    .isInstanceOf(Error)
                    .hasProperty('message', 'Oops');

                stub1.parent.restore();
                done();
            });
    }

    @test('loadExtensions - ')
    testLoadExtensions1() {

    }

}
