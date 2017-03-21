import { OnModuleResolved } from '../../src/module/hook';
import * as Boom from 'boom';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import { Observer } from 'rxjs/Observer';
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
        Hapiness['registerPlugin'] = () => Observable.create(obs => {
            obs.next();
            obs.complete();
        });
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
                Hapiness.kill().subscribe(() => done());
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
                Hapiness.kill().subscribe(() => done());
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
        class ModuleStartTest2 {}
        Hapiness.bootstrap(ModuleStartTest2)
            .then(() => {
                @HapinessModule({
                    version: '1.0.0',
                    options: { host: '0.0.0.0', port: 4444 }
                })
                class ModuleStartTest implements OnError {
                    onError(error) {
                        unit.must(error.code).equal('EADDRINUSE');
                        Hapiness.kill().subscribe(() => done());
                    }
                }

                Hapiness.bootstrap(ModuleStartTest)
                    .then(() => {})
                    .catch((error) => unit.must(error.code).equal('EADDRINUSE'));
            });

    }

    @test('Module dependencies - Root')
    testModuleDependenciesRoot(done) {

        @HapinessModule({
            version: '1.0.0',
        })
        class MyDep {}

        @HapinessModule({
            version: '1.0.0',
            options: { host: '0.0.0.0', port: 4449 },
            imports: [ MyDep ]
        })
        class ModuleDepTest implements OnModuleResolved {
            onModuleResolved(module) {
                return Observable.create((observer) => {
                    unit.must(module).equal('MyDep');
                    observer.next();
                    observer.complete();
                    Hapiness.kill().subscribe(() => done());
                });
            }
        }

        Hapiness.bootstrap(ModuleDepTest)
            .then(() => {});

    }

    @test('Module dependencies - Root - Error')
    testModuleDependenciesRootError(done) {

        @HapinessModule({
            version: '1.0.0',
        })
        class MyDep {}

        @HapinessModule({
            version: '1.0.0',
            options: { host: '0.0.0.0', port: 4449 },
            imports: [ MyDep ]
        })
        class ModuleDepTest implements OnModuleResolved, OnError {
            onModuleResolved(module) {
                return Observable.create((observer) => {
                    observer.error(new Error('Error test'));
                });
            }

            onError(error) {
                unit.must(error.message).equal('Error test');
                Hapiness.kill().subscribe(() => done());
            }
        }

        Hapiness.bootstrap(ModuleDepTest)
            .then(() => {})
            .catch(err => {});

    }

    @test('Module dependencies - Primary - Error')
    testModuleDependenciesPrimaryError(done) {

        @HapinessModule({
            version: '1.0.0',
        })
        class MyDep {}

        @HapinessModule({
            version: '1.0.0',
            imports: [ MyDep ]
        })
        class Primary implements OnModuleResolved {
            onModuleResolved(module) {
                return Observable.create((observer) => {
                    observer.error(new Error('Error test'));
                });
            }
        }

        @HapinessModule({
            version: '1.0.0',
            options: { host: '0.0.0.0', port: 4449 },
            imports: [ Primary ]
        })
        class ModuleDepTest implements OnError {
            onError(error) {
                unit.must(error.message).equal('Error test');
                Hapiness.kill().subscribe(() => done());
            }
        }

        Hapiness.bootstrap(ModuleDepTest)
            .then(() => {})
            .catch(err => {});

    }

    @test('Module dependencies - Root as arg - Error')
    testModuleDependenciesErrorRootAsArg(done) {

        @HapinessModule({
            version: '1.0.0',
            options: { host: '0.0.0.0', port: 4449 }
        })
        class ModuleDepTest {}

        const module = ModuleBuilder.buildModule(ModuleDepTest);
        Hapiness['handleRegistration'](module)(null,  null, err => {
            unit.must(err.message).equal('You cannot register Root Module as Plugin');
            done();
        });
    }

    @test('Module dependencies - Plugin')
    testModuleDependencies(done) {

        @HapinessModule({
            version: '1.0.0',
        })
        class MyDep {}

        @HapinessModule({
            version: '1.0.0',
            options: { host: '0.0.0.0', port: 4449 },
            imports: [ MyDep ]
        })
        class PluginTest implements OnModuleResolved {
            onModuleResolved(module) {
                return Observable.create((observer) => {
                    unit.must(module).equal('MyDep');
                    observer.next();
                    observer.complete();
                    Hapiness.kill().subscribe(() => done());
                });
            }
        }

        @HapinessModule({
            version: '1.0.0',
            imports: [PluginTest]
        })
        class ModuleDepTest {}

        Hapiness.bootstrap(ModuleDepTest)
            .then(() => {});

    }

}
