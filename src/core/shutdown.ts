import { from, Observable, Subject } from 'rxjs';
import { concatMap, filter, flatMap, map, toArray } from 'rxjs/operators';
import { ExtensionShutdownPriority } from '.';
import { ExtensionShutdown } from './interfaces';

export class ShutdownUtils {

    public events$: Subject<string>;

    constructor() {
        this.events$ = new Subject();
        process.once('SIGTERM', () => {
            this.events$.next('SIGTERM');
        });
        process.once('SIGINT', () => {
            this.events$.next('SIGINT');
        });
    }

    /**
     * Shutdown all extensions
     *
     * @param  {ExtensionShutdown[]} items
     * @returns Observable
     */
    shutdown(items: ExtensionShutdown[]): Observable<boolean> {
        return from(items)
            .pipe(
                filter(_ => _.priority === ExtensionShutdownPriority.IMPORTANT),
                flatMap(_ => _.resolver),
                toArray(),
                concatMap(_ =>
                    from(items)
                        .pipe(
                            filter(__ => __.priority === ExtensionShutdownPriority.NORMAL),
                            flatMap(__ => __.resolver),
                            toArray()
                        )
                ),
                map(_ => true)
            );
    }

}
