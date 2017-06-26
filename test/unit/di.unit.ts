import { test, suite } from 'mocha-typescript';
import * as unit from 'unit.js';
import { Injectable, Inject, Lib, DependencyInjection } from '../../src/core';

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

@suite('Unit - Dependency Injection')
class DI {

    @test('service injection')
    testInjection() {

        const injector = DependencyInjection.createAndResolve([MyService, MyService2]);
        unit.must(injector.get(MyService2).my()).equal('hello');

    }

    @test('service injection - extends')
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

    @test('service injection - error')
    testInjectionError() {

        const injector = DependencyInjection.createAndResolve([MyService2]);
        try {
            const svc = injector.get(MyService2);
        } catch (e) {
            unit.must(e.message).contain('No provider for MyService!');
        }

    }

    @test('instantiate a component')
    testInstantiate() {
        @Injectable()
        class Service {
            meth() { return 1; }
        }
        @Lib()
        class Component {
            constructor(@Inject(Service) public serv: Service) {}
        }
        const injector = DependencyInjection.createAndResolve([ Service ]);
        unit.must(DependencyInjection.instantiateComponent(Component, injector).serv.meth()).equal(1);
    }
}
