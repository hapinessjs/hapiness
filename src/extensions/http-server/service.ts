import { Injectable, Inject } from '../../core';
import { HttpServerExt, Server } from './';
import { Observable } from 'rxjs';

@Injectable()
export class HttpServerService {

    constructor(
        @Inject(HttpServerExt) private httpServer: Server
    ) {}

    /**
     * Get HapiJS Server instance
     *
     * @returns Server
     */
    instance(): Server {
        return this.httpServer;
    }

    /**
     * Stop the HapiJS Server
     *
     * @returns Observable
     */
    stop(): Observable<Error> {
        return Observable
            .fromPromise(this.httpServer.stop());
    }

}
