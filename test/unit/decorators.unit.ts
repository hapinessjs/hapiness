import { test, suite } from 'mocha-typescript';
import * as unit from 'unit.js';
import { HapinessModule, extractMetadata } from '../../src';

@suite('Decorators')
class Decorators {

    @test('Check module metadata')
    testMetadata() {

        @HapinessModule({
            version: '1.0.0',
            options: { test: 'test' }
        })
        class TestModule {}

        const meta = extractMetadata(TestModule);
        meta.forEach(m => {
            unit.must(m.version).equal('1.0.0');
            unit.object(m.options).is({ test: 'test' });
        });

    }
}
