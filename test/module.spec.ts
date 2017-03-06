import { OnStart, OnError } from '../src/module/hook';
import { HapinessModule } from '../src/core';
import { Hapiness } from '../src/core/core';
import { buildModule } from '../src/module';
import { extractMetadata } from '../src/util';
import { Injectable, ReflectiveInjector } from 'injection-js';
import * as Lab from 'lab';
import * as Code from 'code';
import {    resolveReflectiveProviders,
            ResolvedReflectiveProvider,
            ResolvedReflectiveFactory,
            ReflectiveDependency } from 'injection-js/reflective_provider';

export const lab    = Lab.script();
const describe      = lab.describe;
const it            = lab.it;
const expect        = Code.expect;

/**
 * Create an Module mock
 */
class TestDep {
    log() { return 'yo'; }
}
@Injectable()
class TestDep2 {
    constructor(private testDep: TestDep) {}
    getLog() { return this.testDep.log(); }
}
@HapinessModule({
    version: '1.0.0'
})
class SubSubTestModule {}
@HapinessModule({
    version: '1.0.0'
})
class SubTestModule {}
@HapinessModule({
    version: '1.0.0',
    imports: [SubSubTestModule]
})
class SubTestModule2 {}
@HapinessModule({
    version: '1.0.0',
    options: { host: '0.0.0.0', port: 4443 },
    providers: [TestDep, TestDep2],
    imports: [SubTestModule, SubTestModule2]
})
class TestModule implements OnStart {
    private toto = 'tt';
    constructor(private svc: TestDep, private svc2: TestDep2) {}
    test() {
        return this.svc.log();
    }
    onStart() {
        console.log('START');
    }
}


describe('Module', () => {
    it('Check module creation', (done) => {

        const module = buildModule(TestModule);
        expect(module.name).equals('TestModule');
        expect(module.version).equals('1.0.0');
        expect(module.options).equals({ host: '0.0.0.0', port: 4443 });
        expect(module.di.get(TestDep2).getLog()).equals('yo');
        done();

    });

    it('', (done) => {
        buildModule(TestModule);
        done();
    });

    it('', (done) => {

        const module = buildModule(TestModule);
        const dependencies: ReflectiveDependency[] = ReflectiveInjector.resolve([TestModule])
            .reduce((a, x: ResolvedReflectiveProvider) => a.concat(x.resolvedFactories), [])
            .reduce((a, r: ResolvedReflectiveFactory) => a.concat(r.dependencies), []);

        const mymodule: TestModule = Reflect.construct(TestModule,
            dependencies.map(d => d.key.token)
                        .map(t => module.di.get(t))
        );

        expect(mymodule.test()).equals('yo');

        done();

    });

    /*it('', (done) => {
        Hapiness.bootstrap(TestModule).then(() => done());
    });*/

    it('', (done) => {
        @HapinessModule({
            version: 'll',
            providers: [TestDep]
        })
        class TestOnStart implements OnStart, OnError {
            constructor(private td: TestDep) {}
            onStart() {
                console.log('START');
                expect(this.td.log()).equals('yo');
                done();
            }
            onError(error) {
                console.error('ERROR', error);
            }
        }
        Hapiness.bootstrap(TestModule)
            .then(() => done())
            .catch((err) => console.error('PROMISE', err));
    });

});
