import { OpaqueToken } from '../../lib/injection-js';
import { test, suite } from 'mocha-typescript';
import * as unit from 'unit.js';
import { HapinessModule, ModuleBuilder } from '../../src';
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
        try {
            Reflect.apply(ModuleBuilder['metadataFromModule'], ModuleBuilder, [TestModule]);
        } catch (e) {
            unit.object(e).is(new Error('Please define a Module with the right annotation'));
        }

    }

    @test('Convert metadata to object')
    testMetadataToObject() {

        class TestModule {}
        const meta = {
            version: '1.0.0'
        };
        const module = Reflect.apply(ModuleBuilder['coreModuleFromMetadata'], ModuleBuilder, [meta, TestModule]);
        unit.must(module.instance).instanceof(TestModule);
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
        unit.must(module.instance).instanceof(TestModule);
        unit.must(module.name).equal('TestModule');

        unit.must(module.providers[0].useClass).equal(MyType);
        unit.must(module.providers[0].provide).equal(MyType);

        unit.must(module.providers[1].useClass).equal(MyType2);
        unit.must(module.providers[1].provide).equal(token);

    }

    @test('Build module')
    testBuild() {

        const module = ModuleBuilder.buildModule(TestModule);
        unit.must(module.name).equal('TestModule');
        unit.must(module.version).equal('1.0.0');
        unit.object(module.options).is({ host: '0.0.0.0', port: 4443 });
        unit.must(module.di.get(LoggerWrapper).log('test')).equal('test');

    }

    @test('Build module - Error')
    testBuildError() {

        class TestModuleError {}
        try {
            ModuleBuilder.buildModule(TestModuleError);
        } catch (e) {
            unit.object(e).is(new Error('Please define a Module with the right annotation'));
        }

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
}