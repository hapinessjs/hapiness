import { MainModule, CoreModule, CoreRoute } from './';
import * as uuid from 'uuid';



export class Lifecycle {

    static initialize(main: MainModule) {

        main.server.ext('onRequest', (request, reply) => {
            console.log(request.id);
            reply.continue();
        });

        main.server.ext('onPreAuth', (request, reply) => {
            console.log(request.id);
            reply.continue();
        });

    }

    private static findRoute(module: CoreModule, method: string, path: string): CoreRoute {
        const lookup = (_module: CoreModule) => {
            const found = _module.routes.find(r => (r.method === method && r.path === path));
            if (!!found) {
                return found;
            } else {
                if (_module.modules && _module.modules.length > 0) {
                    return _module.modules.reduce((acc, cur) => acc.concat(lookup(cur)), [])
                        .filter(r => !!r)
                        .pop();
                }
                return;
            }
        };
        return lookup(module);
    }
}
