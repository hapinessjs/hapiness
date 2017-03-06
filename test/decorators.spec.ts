import { HapinessModule } from '../src/index';
import * as Lab from 'lab';
import * as Code from 'code';
import { extractMetadata } from '../src/util';

export const lab    = Lab.script();
const describe      = lab.describe;
const it            = lab.it;
const expect        = Code.expect;

/**
 * Create an Module mock
 */
@HapinessModule({
    version: '1.0.0',
    options: { test: 'test' }
})
class TestModule {}

describe('Decorators', () => {
    it('Check module metadata', (done) => {

        const meta = extractMetadata(TestModule);
        meta.forEach(m => {
            expect(m.version).equals('1.0.0');
            expect(m.options).equals({ test: 'test' });
        });
        done();

    });
});
