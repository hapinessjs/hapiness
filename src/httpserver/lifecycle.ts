import { Observable, of } from "rxjs";
import { FastifyServer, HttpServerRequest } from "./extension";
import { MetadataAndName, CoreModule, errorHandler, DependencyInjection } from "../core";
import { Lifecycle } from "./decorators";

export function buildLifecycleComponents(module: CoreModule, decorators: MetadataAndName<Lifecycle>[], server: FastifyServer): Observable<void> {

    // server.addHook('onError', (req, repl, error) => errorHandler(error));

    server.addHook('onRequest', (request, reply, next) => {
        const di = ((reply.context.config || {}).module || {}).di;
        console.log(server.printRoutes(), di)
        if (di) {
            DependencyInjection.createAndResolve([{ provide: HttpServerRequest, useValue: request }], di).subscribe(
                newDI => {
                    request['_hapiness'] = { di: newDI };
                    next();
                }
            );
        } else {
            console.log('WSSDSDSDSDDSDD')
            next();
        }
    });

    return of(null);
}
