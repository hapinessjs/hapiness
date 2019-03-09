import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { InternalLogger } from '../core';

export interface EventData {
    type: string;
    data: any;
}

export class EventManager {

    private stream$ = new Subject<EventData>();
    private logger = new InternalLogger('event-manager');

    /**
     * Add a listener filtered on type
     *
     * @param  {string} type
     * @returns Observable
     */
    public on(type: string): Observable<EventData> {
        this.logger.debug(`listener added on ${type}`);
        return this
            .stream$
            .pipe(
                filter(_ => !!_ && _.type === type)
            );
    }

    /**
     * Emit data for type
     *
     * @param  {string} type
     * @param  {any} data
     * @returns void
     */
    public emit(type: string, data: any): void {
        this.logger.debug(`send data on ${type}`);
        this
            .stream$
            .next({ type, data });
    }

    /**
     * Close the stream event
     *
     * @returns void
     */
    public close(): void {
        this.logger.debug(`manager closed`);
        this
            .stream$
            .complete();
    }

}
