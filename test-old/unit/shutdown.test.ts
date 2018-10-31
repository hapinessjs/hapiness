import { suite, test } from 'mocha-typescript';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as unit from 'unit.js';
import { ExtensionShutdownPriority } from '../../src';
import { ShutdownUtils } from '../../src/core/shutdown';

@suite('Unit - Shutdown')
export class Shutdown {
    @test('shutdown - should shutdown extensions in right order')
    test1(done) {

        let i = 0;

        const list = [
            {
                priority: ExtensionShutdownPriority.IMPORTANT,
                resolver: of(true)
                    .pipe(
                        tap(_ => {
                            unit.bool(i === 0 || i === 1).isTrue();
                            i++;
                        })
                    )
            },
            {
                priority: ExtensionShutdownPriority.NORMAL,
                resolver: of(true)
                    .pipe(
                        tap(_ => {
                            unit.number(i).is(2);
                            i++;
                        })
                    )
            },
            {
                priority: ExtensionShutdownPriority.IMPORTANT,
                resolver: of(true)
                    .pipe(
                        tap(_ => {
                            unit.bool(i === 0 || i === 1).isTrue();
                            i++;
                        })
                    )
            }
        ];

        const su = new ShutdownUtils();
        su.shutdown(list).subscribe(null, null, () => done());

    }
}
