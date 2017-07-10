import { suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { HapinessModule, extractMetadataByDecorator, extractMetadata } from '../../src/core';

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
