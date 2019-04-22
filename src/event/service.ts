import { Inject, Service } from '..';
import { EventExtension, EventManager, EventData } from './';
import { Observable } from 'rxjs';

@Service()
export class EventService {

    constructor(
        @Inject(EventExtension) private manager: EventManager
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
