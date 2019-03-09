import { Injectable, Inject } from '../core';
import { EventExt, EventManager, EventData } from './';
import { Observable } from 'rxjs';

@Injectable()
export class EventService {

    constructor(
        @Inject(EventExt) private manager: EventManager
    ) {}

    /**
     * Add listener on type
     *
     * @returns EventData
     */
    on(type: string): Observable<EventData> {
        return this.manager.on(type);
    }

    /**
     * Send data for type
     *
     * @param  {string} type
     * @param  {any} data
     * @returns void
     */
    emit(type: string, data: any): void {
        this.manager.emit(type, data);
    }

}
