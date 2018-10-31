import { suite, test } from 'mocha-typescript';
import { flatMap, tap } from 'rxjs/operators';
import * as unit from 'unit.js';
import { DependencyInjection, Injectable, Lib } from '../../src/core';

import { EmptyProvider } from './mocks';

@suite('Unit - DI')
export class ModuleTestSuite {

    @test('createAndResolve - provide providers without parent and must return DI')
    testCreateAndResolve1() {

        DependencyInjection
            .createAndResolve([ EmptyProvider ])
            .subscribe(
                _ =>
                    unit
                        .object(_.get(EmptyProvider))
                        .isInstanceOf(EmptyProvider)
            );

    }

    @test('createAndResolve - provide providers with parent and must return DI')
    testCreateAndResolve2() {

        @Injectable()
        class ParentProvider {
        }

        DependencyInjection
            .createAndResolve([ ParentProvider ])
            .pipe(
                flatMap(_ => DependencyInjection.createAndResolve([ EmptyProvider ], _))
            )
            .subscribe(
                _ =>
                    unit
                        .object(_.get(ParentProvider))
                        .isInstanceOf(ParentProvider)
            );

    }

    @test('createAndResolve - provide provider that thrown error')
    testCreateAndResolve3() {

        @Injectable()
        class ParentProvider {
            constructor() {
                throw new Error('Oops');
            }
        }

        DependencyInjection
            .createAndResolve([ ParentProvider ])
            .subscribe(
                null,
                _ =>
                    unit
                        .object(_)
                        .isInstanceOf(Error)
                        .hasProperty('message', 'Oops')
            );

    }

    @test('createAndResolve - provide parent and provide an already injected provider')
    testCreateAndResolve4() {

        let count = 0;

        @Injectable()
        class TestProvider {
            constructor() {
                count++;
            }
        }

        DependencyInjection
            .createAndResolve([ TestProvider ])
            .pipe(
                tap(_ => _.get(TestProvider)),
                flatMap(_ => DependencyInjection.createAndResolve([ TestProvider ], _))
            )
            .subscribe(
                _ => {
                    _.get(TestProvider);
                    unit
                        .number(count)
                        .is(2);
                }
            );

    }

    @test('instantiateComponent - instantiate Lib component with provider dependency')
    testInstantiateComponent1() {

        @Lib()
        class TestLib {
            constructor(public provider: EmptyProvider) {
            }
        }

        DependencyInjection
            .createAndResolve([ EmptyProvider ])
            .pipe(
                flatMap(_ =>
                    DependencyInjection
                        .instantiateComponent(TestLib, _)
                )
            )
            .subscribe(
                _ =>
                    unit
                        .object(_.provider)
                        .isInstanceOf(EmptyProvider)
            );

    }

    @test('instantiateComponent - instantiate Lib and with no provider')
    testInstantiateComponent2() {

        @Lib()
        class TestLib {
            constructor(public provider: EmptyProvider) {
            }
        }

        DependencyInjection
            .createAndResolve([])
            .pipe(
                flatMap(_ =>
                    DependencyInjection
                        .instantiateComponent(TestLib, _)
                )
            )
            .subscribe(
                null,
                _ =>
                    unit
                        .object(_)
                        .isInstanceOf(Error)
            );

    }
}
