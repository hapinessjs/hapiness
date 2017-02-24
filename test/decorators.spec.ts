import { HapinessModule } from '../src/index';
import * as Lab from 'lab';
import * as Code from 'code';

export const lab    = Lab.script();
const experiment    = lab.experiment;
const test          = lab.test;
const expect        = Code.expect;

/**
 * Create an Module mock
 */
@HapinessModule({
    version: '1.0.0',
    options: { test: 'test' }
})
class TestModule {
    foo() {
        return 1;
    }
}

experiment('Decorators', () => {
    test('Check module metadata', (done) => {

        Reflect.getOwnMetadataKeys(TestModule)
            .filter(x => x === 'annotations')
            .forEach(x => {
                const meta = <Array<HapinessModule>>Reflect.getOwnMetadata(x, TestModule);
                meta.forEach(m => {
                    expect(m.version).equals('1.0.0');
                    expect(m.options).equals({ test: 'test' });
                });
            });
        expect(new TestModule().foo()).to.be.equal(1);
        done();

    });
});
