import { suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { HapinessModule, Hapiness, Injectable, HttpServerExt, InjectionToken } from '../../src';

@suite('Integration - Module import multiple times')
export class SocketServerIntegration {

    @test('simple module')
    test1(done) {

        @HapinessModule({
            version: '1.0.0'
        })
        class ToImportModule {}

        @HapinessModule({
            version: '1.0.0',
            imports: [ ToImportModule ]
        })
        class SubModuleTest {}

        @HapinessModule({
            version: '1.0.0',
            imports: [ ToImportModule, SubModuleTest ]
        })
        class ModuleTest {}

        Hapiness.bootstrap(ModuleTest)
            .then(() => done())
            .catch(err => done(err));
    }

    @test('simple module using provider')
    test2(done) {

        @Injectable()
        class MyService {
            foo() {
                return 'bar';
            }
        }

        @HapinessModule({
            version: '1.0.0',
            exports: [ MyService ]
        })
        class ToImportModule {}

        @HapinessModule({
            version: '1.0.0',
            imports: [ ToImportModule ]
        })
        class SubModuleTest {
            constructor(my: MyService) {
                unit.string(my.foo()).is('bar');
            }
        }

        @HapinessModule({
            version: '1.0.0',
            imports: [ ToImportModule, SubModuleTest ]
        })
        class ModuleTest {
            constructor(my: MyService) {
                unit.string(my.foo()).is('bar');
            }
        }

        Hapiness.bootstrap(ModuleTest)
            .then(() => done())
            .catch(err => done(err));
    }

    @test('simple module with HttpServerExt')
    test3(done) {

        @HapinessModule({
            version: '1.0.0'
        })
        class ToImportModule {}

        @HapinessModule({
            version: '1.0.0',
            imports: [ ToImportModule ]
        })
        class SubModuleTest {}

        @HapinessModule({
            version: '1.0.0',
            imports: [ ToImportModule, SubModuleTest ]
        })
        class ModuleTest {}

        Hapiness.bootstrap(ModuleTest, [ HttpServerExt ])
            .then(() => Hapiness.shutdown().subscribe(() => done()))
            .catch(err => done(err));
    }

    @test('module with InjectionToken with HttpServerExt')
    test4(done) {

        const it = new InjectionToken('test');

        @HapinessModule({
            version: '1.0.0',
            providers: [{ provide: it, useValue: { foo: 'bar' } }]
        })
        class ToImportModule {}

        @HapinessModule({
            version: '1.0.0',
            imports: [ ToImportModule ]
        })
        class SubModuleTest {}

        @HapinessModule({
            version: '1.0.0',
            imports: [ ToImportModule, SubModuleTest ]
        })
        class ModuleTest {}

        Hapiness.bootstrap(ModuleTest, [ HttpServerExt ])
            .then(() => Hapiness.shutdown().subscribe(() => done()))
            .catch(err => done(err));
    }
}
