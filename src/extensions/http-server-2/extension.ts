import { Extension, ExtensionConfig, ExtensionValue } from '../../core/extensions';
import * as Fastify from 'fastify';
import { CoreModule } from '../../core';
import { Observable, of } from 'rxjs';
import { flatMap, mapTo } from 'rxjs/operators';

export type ServerHTTP = Fastify.FastifyInstance;

export class HttpServerExt extends Extension<ServerHTTP> {

    onLoad(module: CoreModule, config: ExtensionConfig): Observable<ExtensionValue<ServerHTTP>> {
        return of(Fastify()).pipe(
            flatMap(value => of(config)
                .pipe(
                    flatMap(_ => value.listen(_.port, _.host)),
                    mapTo(({
                        value,
                        instance: this,
                        token: HttpServerExt
                    }))
                )
            )
        );
    }

    onBuild(module: CoreModule) { return of(null); }

    onShutdown(module: CoreModule) { return of(null) }

}
