import { Hapiness } from '../../src/core/bootstrap';
import { HapinessModule, Extention } from '../../src/core/decorators';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import { test, suite, only } from 'mocha-typescript';
import * as unit from 'unit.js';

@only
@suite('NEW')
class NEW {
    @test('----')
    testNew(done) {

        @HapinessModule({
            version: ''
        })
        class Module {}

        @Extention({
            version: ''
        })
        class Ext {

            onExtentionLoaded() {
                
            }

        }

        // Hapiness.bootstrap(Module, [ Ext ]).then(_ => done());

        Hapiness.bootstrap(Module, [Ext])
            .then(_ => done())
            .catch(_ => done(_));

    }
}

