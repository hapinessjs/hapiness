import * as Boom from 'boom';
import { Observable } from 'rxjs/Rx';
import { test, suite, only } from 'mocha-typescript';
import * as unit from 'unit.js';
import { TestModule, SubModule } from './common/module.mock';
import {
    Hapiness,
    MainModule,
    ModuleBuilder,
    OnStart,
    OnError,
    OnRegister,
    HapinessModule,
    lightObservable
} from '../../src';

@suite('Core')
class Decorators {

    @test('Flatten importation tree')
    testFlattenTree() {

        Hapiness['mainModule'] = <MainModule>ModuleBuilder.buildModule(TestModule);
        const names = Reflect.apply(Hapiness['flattenModules'], Hapiness, []);

        unit.object(names).is(['SubModule', 'SubModuleWithImports', 'SubSubModule']);

    }

    @test('Names to Observables')
    testNamesToObservables() {

        Hapiness['mainModule'] = <MainModule>ModuleBuilder.buildModule(TestModule);
        const names = Reflect.apply(Hapiness['flattenModules'], Hapiness, []);
        const register = Hapiness['registerPlugin'];
        Hapiness['registerPlugin'] = () => lightObservable();
        const result = Reflect.apply(Hapiness['registrationObservables'], Hapiness, [names]);
        result.forEach(o => {
            unit.must(o).instanceof(Observable);
        });
        Hapiness['registerPlugin'] = register;

    }

    @test('Plugin registration')
    testPluginRegistration(done) {

        Hapiness.bootstrap(TestModule)
            .then(() => {
                unit.object(Object.keys(Hapiness['mainModule'].server['registrations']))
                    .is(['SubModule', 'SubModuleWithImports', 'SubSubModule']);

                done();
             })
            .catch((error) => done(error));

    }

    @test('Plugin registration - Hook')
    testPluginRegistrationHook(done) {

        @HapinessModule({
            version: '1.0.0'
        })
        class SubModuleRegisterTest implements OnRegister {
            onRegister() {
                done();
            }
        }
        @HapinessModule({
            version: '1.0.0',
            options: { host: '0.0.0.0', port: 4448 },
            imports: [ SubModuleRegisterTest ]
        })
        class ModuleRegisterTest {}
        Hapiness.bootstrap(ModuleRegisterTest).then(() => {});

    }

    @test('Plugin registration - Error argument')
    testPluginRegistrationErrorArg() {

        Reflect.apply(Hapiness['registerPlugin'], Hapiness, []).subscribe(() => {}, (error) => {
            unit.object(error).is(Boom.create(500, 'Module argument is missing'));
        });

    }

    @test('Plugin registration - Error unique registration')
    testPluginRegistrationError(done) {

        const handler = Hapiness['handleRegistration'];
        Hapiness['handleRegistration'] = function() {
            return (s, o, n) => {
                n(new Error('TestError'));
            };
        };

        @HapinessModule({
            version: '1.0.0',
            options: { host: '0.0.0.0', port: 4446 },
            imports: [ SubModule ]
        })
        class ModuleStartTestError implements OnError {
            onError(error) {
                unit.object(error).is(new Error('TestError'));
                Hapiness['handleRegistration'] = handler;
                done();
            }
        }

        Hapiness.bootstrap(ModuleStartTestError)
        .catch((error) => {
            unit.object(error).is(new Error('TestError'));
        });

    }

    @test('Start Server')
    testStart(done) {

        @HapinessModule({
            version: '1.0.0',
            options: { host: '0.0.0.0', port: 4444 }
        })
        class ModuleStartTest implements OnStart {
            onStart() {
                done();
            }
        }

        Hapiness.bootstrap(ModuleStartTest).then(() => {});

    }

    @test('Start Server - Error port already used')
    testStartError(done) {

        @HapinessModule({
            version: '1.0.0',
            options: { host: '0.0.0.0', port: 4444 }
        })
        class ModuleStartTest implements OnError {
            onError(error) {
                unit.must(error.code).equal('EADDRINUSE');
                done();
            }
        }

        Hapiness.bootstrap(ModuleStartTest)
            .then(() => {})
            .catch((error) => unit.must(error.code).equal('EADDRINUSE'));

    }

}
