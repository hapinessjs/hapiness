import { Subject, Observable } from 'rxjs';
import { ExtensionShutdown } from './interfaces';
import { ExtensionShutdownPriority } from '.';

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
        return Observable
            .from(items)
            .filter(_ => _.priority === ExtensionShutdownPriority.IMPORTANT)
            .flatMap(_ => _.resolver)
            .toArray()
            .concatMap(_ => Observable
                .from(items)
                .filter(__ => __.priority === ExtensionShutdownPriority.NORMAL)
                .flatMap(__ => __.resolver)
                .toArray()
            )
            .map(_ => true);
    }

}
