import { OnExtentionLoad } from '../../core/bootstrap';
import { Observable } from 'rxjs/Observable';
import { Server, RouteConfiguration } from 'hapi';
import * as Hoek from 'hoek';

export interface HapiConfig {
    host: string;
    port: number;
}

export class HttpServerExtention implements OnExtentionLoad {

    onExtentionLoad(config: HapiConfig): Observable<any> {
        const server = new Server();
        const connection = server.connection(config);
        return Observable.create();
    }

}
