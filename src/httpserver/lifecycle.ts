import { Observable, of } from 'rxjs';
import { FastifyServer, HttpServerRequest } from './extension';
import { MetadataAndName, CoreModule, errorHandler, DependencyInjection } from '../core';
import { Lifecycle } from './decorators';
import { arr } from '../core/utils';

export function buildLifecycleComponents(decorators: MetadataAndName<Lifecycle>[], server: FastifyServer): Observable<void> {

    // server.addHook('onError', (req, repl, error) => errorHandler(error));

    server.addHook('onRequest', (request, reply, next) => {
        const di = ((reply.context.config || {}).module || {}).di;
        if (di) {
            DependencyInjection.createAndResolve([{ provide: HttpServerRequest, useValue: request }], di).subscribe(
                newDI => {
                    request['_hapiness'] = { di: newDI };
                    next();
                }
            );
            console.log(decorators.map(_ => _.property));
        } else {
            next();
        }
    });

    return of(null);
}

function instantiate(hook: string, decorators: MetadataAndName<Lifecycle>[]) {
    arr(decorators)
        .filter(decorator => decorator.property === hook);

}
