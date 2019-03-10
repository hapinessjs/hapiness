import { Hapiness, Module, Lib, Inject, ExtensionShutdownPriority, ExtensionType, Injectable } from '../../../src/core';
import { HttpServer, HttpServerRequest } from '../../../src/httpserver/extension';
import { Extension } from '../../../src/core/extensions';
import { of, Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Route, Get } from '../../../src/httpserver/decorators';
import { Property, Required } from '@juneil/tschema';


export class Logger extends Extension<any> {
    // constructor() { super(); }

    static type = ExtensionType.LOGGING;

    onLoad() {
        const value = {
            debug: console.log,
            info: console.log,
            warn: console.log,
            error: console.log,
            fatal: console.log
        };
        return of(this.loadedResult(value));
    }
    onBuild() { return of(null); }
    onShutdown() { return null; }
}

class Weird extends Extension<number> {
    onLoad() {
        return of(this.loadedResult(1)).pipe(delay(10));
    }
    onBuild() { return of(null); }
    onShutdown() { return { priority: ExtensionShutdownPriority.IMPORTANT, resolver: of(null) }; }
}

// @Lib()
// class Lib1 {
//     constructor(@Inject(Logger) logger: any) {
//         logger.info('YO');
//     }
// }

@Injectable()
class BDep {
    foo() { return 3; }
}

@Injectable()
class ADep {
    foo() { return 1; }
}

@Injectable()
class TestService {
    constructor(private dep: BDep) {}
    foo() { return 'foo lala ' + this.dep.foo(); }
}

@Module({ version: '1', exports: [ TestService ]})
class SubModule {}


class Query {
    @Property()
    foo: boolean;
    @Property()
    yolo: number;
}

@Route({
    path: '/'
})
class RouteA {

    constructor(private test: TestService) {}

    @Get({
        query: Query
    })
    handler(query: Query, toto: string) {
        console.log('>>>> access to route', query, toto);
        return { message: this.test.foo() };
    }

}



@Module({
    version: '1',
    declarations: [ RouteA ],
    providers: [ ADep ],
    imports: [ SubModule ]
})
class MyMod {
    onStart() {
        console.log('started...');
        // console.log(Reflect.getMetadataKeys(RouteA));
        // console.log(Reflect.getMetadata('propMetadata', RouteA));
        // console.log(Extension.extractMetadata(RouteA, 'handler'));
    }
}


Hapiness.bootstrap(MyMod, [
    HttpServer,
    Logger, Weird.setConfig({ uri: 'uri://yolo:99' })
], { retry: { interval: 100, count: 2 } })
.catch(err => console.log(err));

