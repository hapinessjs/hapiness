import { Extention } from '../../core_bis';
import { CoreModule, ModuleManager } from '../../core/module';
import { OnExtentionLoad } from '../../core/bootstrap';
import { Observable } from 'rxjs/Observable';
import { Server, RouteConfiguration } from 'hapi';
import * as Hoek from 'hoek';

export interface HapiConfig {
    host: string;
    port: number;
}

export class HttpServer implements OnExtentionLoad {

    onExtentionLoad(module: CoreModule, config: HapiConfig): Observable<Extention> {
        const server = new Server();
        const connection = server.connection(config);
        return Observable.create(observer => {
            ModuleManager.getElements(module, 'declarations');
            server.start(_ => {
                observer.next({
                    instance: server
                });
                observer.complete();
            });
        });
    }
}
