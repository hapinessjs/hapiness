import { test, suite, only } from 'mocha-typescript';
import * as unit from 'unit.js';
import { TypeDecorator, makeDecorator } from 'injection-js/util/decorators';
import { HapinessModule, Injectable } from '../../src';
import { extractMetadata } from '../../src/util';
import * as Boom from 'boom';

interface TestAnnDecorator {
  (obj: TestAnn): TypeDecorator;
  new (obj: TestAnn): TestAnn;
}

interface TestAnn {
    name: string;
}

const TestAnn: TestAnnDecorator = <TestAnnDecorator>makeDecorator('TestAnn', {
    name: undefined
});

@suite('Decorators')
class Decorators {

    @test('Check module metadata')
    testMetadataModule() {

        @HapinessModule({
            version: '1.0.0',
            options: { test: 'test' }
        })
        class TestModule {}

        const meta = <HapinessModule>extractMetadata(TestModule);
        unit.must(meta.version).equal('1.0.0');
        unit.object(meta.options).is({ test: 'test' });

    }

    @test('Check injectable metadata')
    testMetadataInjectable() {

        @Injectable()
        class TestModule {}

        const meta = <Injectable>extractMetadata(TestModule);

    }

    @test('Check metadata - Error decorator not allowed')
    testMetadataError2() {

        @TestAnn({ name: 'test' })
        class TestModule {}

        unit.exception(() => unit.when('', () => extractMetadata(TestModule)))
            .is(Boom.create(500, 'Decorator TestAnn does not exists.'));

    }
}
