import { Injectable } from 'injection-js';
import { buildModule } from '../src/module';
import { HapinessModule } from '../src/index';
import * as Lab from 'lab';
import * as Code from 'code';
import { extractMetadata } from '../src/utils';

export const lab    = Lab.script();
const describe      = lab.describe;
const it            = lab.it;
const expect        = Code.expect;

/**
 * Create an Module mock
 */
class TestDep {
    log() { return 'yo'; }
}
@Injectable()
class TestDep2 {
    constructor(private testDep: TestDep) {}
    getLog() { return this.testDep.log(); }
}
@HapinessModule({
    version: '1.0.0',
    options: { test: 'test' },
    providers: [TestDep, TestDep2]
})
class TestModule {}

describe('Module', () => {
    it('Check module creation', (done) => {

        const module = buildModule(TestModule);
        expect(module.name).equals('TestModule');
        expect(module.version).equals('1.0.0');
        expect(module.options).equals({ test: 'test' });
        expect(module.di.get(TestDep2).getLog()).equals('yo');
        done();

    });
});
