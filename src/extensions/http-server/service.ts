import { from, Observable } from 'rxjs';
import { Inject, Injectable } from '../../core';
import { HttpServerExt, Server } from './';

@Injectable()
export class HttpServerService {

    constructor(
        @Inject(HttpServerExt) private httpServer: Server
    ) {
    }

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
        return from(this.httpServer.stop());
    }

}
