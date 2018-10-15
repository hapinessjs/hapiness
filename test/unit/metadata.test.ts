import { suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { extractMetadata, extractMetadataByDecorator, extractMetadatas, HapinessModule } from '../../src/core';

@suite('Unit - Metadata')
export class Metadata {

    @test('extractMetadatas')
    test1() {
        @HapinessModule({
            version: 'test'
        })
        class TestToken {
        }

        unit.object(extractMetadata(TestToken))
            .contains({ version: 'test' });

    }

    @test('extractMetadatas')
    test3() {

        class TestToken {
        }

        unit.array(extractMetadatas(TestToken))
            .is([]);

    }

    @test('extractMetadataByDecorator')
    test2() {
        @HapinessModule({
            version: 'test123'
        })
        class TestToken {
        }

        unit.object(extractMetadataByDecorator(TestToken, 'HapinessModule'))
            .contains({ version: 'test123' });
    }
}
