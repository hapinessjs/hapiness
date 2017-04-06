import { test, suite } from 'mocha-typescript';
import * as unit from 'unit.js';
import { Injectable } from '../../src';
import { DependencyInjection } from '../../src/core';

class MyService {
    method() {
        return 'hello';
    }
}

@Injectable()
class MyService2 {
    constructor(private svc: MyService) {}
    my() {
        return this.svc.method();
    }
}

@suite('Dependency Injection')
class DI {

    @test('Service Injection')
    testInjection() {

        const injector = DependencyInjection.createAndResolve([MyService, MyService2]);
        unit.must(injector.get(MyService2).my()).equal('hello');

    }

    @test('Service Injection - Extends')
    testInjectionExtends() {

        const injector = DependencyInjection.createAndResolve([MyService, MyService2]);

        @Injectable()
        class MyOwnService {
            constructor(private svc: MyService2) {}
            myTest() {
                return this.svc.my();
            }
        }

        const myInjector = DependencyInjection.createAndResolve([MyOwnService], injector);

        unit.must(myInjector.get(MyOwnService).myTest()).equal('hello');

    }

    @test('Service Injection - Error')
    testInjectionError() {

        const injector = DependencyInjection.createAndResolve([MyService2]);
        try {
            const svc = injector.get(MyService2);
        } catch (e) {
            unit.must(e.message).contain('No provider for MyService!');
        }

    }
}
