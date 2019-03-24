import { Hapiness, Module, ExtensionShutdownPriority, ExtensionType, Injectable, Inject } from '../../../src/core';
import { HttpServer, FastifyServer } from '../../../src/httpserver/extension';
import { Extension } from '../../../src/core/extensions';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Route, Get, Post, Lifecycle } from '../../../src/httpserver/decorators';
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

@Injectable()
class Isolate {
    constructor(@Inject(HttpServer) private server: FastifyServer) {}
    yo() {
        return this.server.printRoutes();
    }
}

@Route({
    path: '/fu'
})
class RouteC {

    constructor(@Inject(HttpServer) private server: FastifyServer, private iso: Isolate) {}

    @Get()
    yo() {
        return this.iso.yo();
    }

}


@Module({
    version: '1',
    exports: [ TestService ],
    declarations: [ RouteC ],
    providers: [ Isolate ],
    prefix: 'sub'
})
class SubModule {}


class Query {
    @Property()
    foo: boolean;
    @Property()
    yolo: number;
}

class Params {
    @Required()
    @Property()
    id: string;
}

class Payload {
    @Property()
    @Required()
    name: string;

    @Property()
    @Required()
    description: string;

    @Property()
    @Required()
    option: boolean;
}

@Route({
    path: '/:id'
})
class RouteA {

    constructor(private test: TestService) {}

    @Get({
        query: Query,
        params: Params
    })
    handler(query: Query, params: Params) {
        console.log('>>>> access to route', query, params);
        return { message: this.test.foo() };
    }

}

@Route({
    path: '/yolo/:id'
})
class RouteB {

    @Post({
        params: Params,
        payload: Payload
    })
    handler(payload: Payload, params: Params) {
        console.log('>>>> access to route', params, payload);
        return payload;
    }

}

// @Lifecycle({
//     event:''
// })
// class MyLC {

//     @Event('request')
//     request()

// }


@Module({
    version: '1',
    declarations: [ RouteA, RouteB ],
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
    Logger, Weird.setConfig({ uri: 'uri://yolo:99', toto: true })
], { retry: { interval: 100, count: 2 } })
.catch(err => console.log(err));

