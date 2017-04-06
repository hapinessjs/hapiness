import { Lib } from '../../src/core/decorators';
import { OpaqueToken } from '../../lib/injection-js';
import { test, suite } from 'mocha-typescript';
import * as unit from 'unit.js';
import { HapinessModule } from '../../src';
import { ModuleBuilder } from '../../src/module';
import { LoggerWrapper, SubModule, SubSubModule, TestModule } from './common/module.mock';

@suite('Module')
class Decorators {

    @test('Metadata extraction')
    testMetadataExtraction() {

        @HapinessModule({
            version: '1.0.0',
            options: { test: 'test' }
        })
        class TestModule {}

        const meta = Reflect.apply(ModuleBuilder['metadataFromModule'], ModuleBuilder, [TestModule]);
        unit.must(meta.version).equal('1.0.0');
        unit.object(meta.options).is({ test: 'test' });
    }

    @test('Metadata extraction - Error')
    testMetadataExtractionError() {

        class TestModule {}
        unit.exception(() => unit.when('', () => Reflect.apply(ModuleBuilder['metadataFromModule'], ModuleBuilder, [TestModule])))
            .is(new Error('Please define a Module with the right annotation'));

    }

    @test('Convert metadata to object')
    testMetadataToObject() {

        class TestModule {}
        const meta = {
            version: '1.0.0'
        };
        const module = Reflect.apply(ModuleBuilder['coreModuleFromMetadata'], ModuleBuilder, [meta, TestModule]);
        unit.must(module.version).equal('1.0.0');
        unit.must(module.name).equal('TestModule');

    }

    @test('Convert metadata to object - With providers')
    testMetadataToObjectProviders() {

        class TestModule {}
        class MyType {}
        class MyType2 {}
        const token = new OpaqueToken('Toto');
        const meta = {
            version: '1.0.0',
            providers: [MyType, { provide: token, useClass: MyType2 }]
        };
        const module = Reflect.apply(ModuleBuilder['coreModuleFromMetadata'], ModuleBuilder, [meta, TestModule]);
        unit.must(module.name).equal('TestModule');

        unit.must(module.providers[0].useClass).equal(MyType);
        unit.must(module.providers[0].provide).equal(MyType);

        unit.must(module.providers[1].useClass).equal(MyType2);
        unit.must(module.providers[1].provide).equal(token);

    }

    @test('Build module')
    testBuild() {

        const module = ModuleBuilder.buildModule(TestModule);
        unit.must(module.instance).instanceof(TestModule);
        unit.must(module.name).equal('TestModule');
        unit.must(module.version).equal('1.0.0');
        unit.object(module.options).is({ host: '0.0.0.0', port: 4443 });
        unit.must(module.di.get(LoggerWrapper).log('test')).equal('test');

    }

    @test('Build module - Error')
    testBuildError() {

        class TestModuleError {}
        unit.exception(() => unit.when('', () => ModuleBuilder.buildModule(TestModuleError)))
            .is(new Error('Please define a Module with the right annotation'));

    }

    @test('Build module - Check module instance')
    testBuildInstance() {

        const module = ModuleBuilder.buildModule(TestModule);
        unit.must(module.instance).instanceof(TestModule);
        unit.must(module.instance.logStuff('yolo')).equal('yolo');

    }

    @test('Find nested module - Find sub')
    testFindNestedModuleSub() {

        const module = ModuleBuilder.buildModule(TestModule);
        const result = ModuleBuilder.findNestedModule(SubModule.name, module);
        unit.must(result.instance).instanceof(SubModule);

    }

    @test('Find nested module - Find sub sub')
    testFindNestedModuleSubSub() {

        const module = ModuleBuilder.buildModule(TestModule);
        const result = ModuleBuilder.findNestedModule(SubSubModule.name, module);
        unit.must(result.instance).instanceof(SubSubModule);

    }

    @test('Find nested module - Nothing found')
    testFindNestedModuleNothingFound() {

        class NotFound {}
        const module = ModuleBuilder.buildModule(TestModule);
        const result = ModuleBuilder.findNestedModule(NotFound.name, module);
        unit.value(result).isUndefined();

    }

    @test('Exports providers')
    testExportsProviders() {

        class MyService {
            load() {
                return 'loaded';
            }
        }

        class TestService {
            load() {
                return 'test';
            }
        }

        @HapinessModule({
            version: '1.0.0',
            exports: [ MyService ]
        })
        class SubModule {}

        @HapinessModule({
            version: '1.0.0',
            providers: [ TestService ],
            imports: [ SubModule ]
        })
        class MyModule {
            constructor(private svc: MyService) {}
            load() {
                return this.svc.load();
            }
        }

        const module = ModuleBuilder.buildModule(MyModule);
        unit.must(module.instance.load()).equal('loaded');

    }

    @test('Exports providers - Empty')
    testExportsProvidersEmpty() {

        @HapinessModule({
            version: '1.0.0'
        })
        class TestEmptyProviders {}

        const module = ModuleBuilder.buildModule(TestEmptyProviders);
        module.providers = null;
        module.modules = null;
        const providers = Reflect.apply(ModuleBuilder['collectProviders'], ModuleBuilder, [module]);
        unit.object(providers).is([]);

    }

    @test('Libs')
    testLib(done) {

        @Lib()
        class MyLib {
            constructor() {
                unit.must(true).equal(true);
                done();
            }
        }

        @HapinessModule({
            version: '1.0.0',
            declarations: [ MyLib ]
        })
        class TestModule {}

        const module = ModuleBuilder.buildModule(TestModule);

    }
}
