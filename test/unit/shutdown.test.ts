import { suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { ExtensionShutdownPriority } from '../../src';
import { Observable } from 'rxjs';
import { ShutdownUtils } from '../../src/core/shutdown';

@suite('Unit - Shutdown')
export class Shutdown {
    @test('shutdown - should shutdown extensions in right order')
    test1(done) {

        let i = 0;

        const list = [
            {
                priority: ExtensionShutdownPriority.IMPORTANT,
                resolver: Observable
                    .of(true)
                    .do(_ => {
                        unit.bool(i === 0 || i === 1).isTrue();
                        i++;
                    })
            },
            {
                priority: ExtensionShutdownPriority.NORMAL,
                resolver: Observable
                    .of(true)
                    .do(_ => {
                        unit.number(i).is(2);
                        i++;
                    })
            },
            {
                priority: ExtensionShutdownPriority.IMPORTANT,
                resolver: Observable
                    .of(true)
                    .do(_ => {
                        unit.bool(i === 0 || i === 1).isTrue();
                        i++;
                    })
            }
        ]

        const su = new ShutdownUtils();
        su.shutdown(list).subscribe(null, null, () => done());

    }
}
