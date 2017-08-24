import { suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { extractMetadataByDecorator, extractMetadata, extractMetadatas } from '../../src/core/metadata';
import { HapinessModule } from '../../src/core/decorators';

@suite('Unit - Metadata')
class Metadata {

    @test('extractMetadatas')
    test1() {
        @HapinessModule({
            version: 'test'
        })
        class TestToken {}

        unit.object(extractMetadata(TestToken))
            .contains({ version: 'test' });

    }

    @test('extractMetadatas')
    test3() {

        class TestToken {}

        unit.array(extractMetadatas(TestToken))
            .is([]);

    }

    @test('extractMetadataByDecorator')
    test2() {
        @HapinessModule({
            version: 'test123'
        })
        class TestToken {}

        unit.object(extractMetadataByDecorator(TestToken, 'HapinessModule'))
            .contains({ version: 'test123' });
    }
}
