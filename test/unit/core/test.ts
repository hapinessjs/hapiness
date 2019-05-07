import { Hapiness, Module } from '../../../src';
import { HttpServer, Route, Get, Post, Lifecycle, Hook } from '../../../src/httpserver';
import { Required, Optional, Item, Enum } from '@juneil/tschema';
import { Biim } from '@hapiness/biim';
import { of, throwError } from 'rxjs';

// import { Route, Get, Lifecycle, Hook, Delete, Post } from '../../../src/httpserver/decorators';
// import { Hapiness, Module, ExtensionType, Extension, HTTPService, Call, Service, InjectionToken, Inject } from '../../../src';
// import { HttpServer, HttpServerRequest, HttpServerConfig } from '../../../src/httpserver/extension';
// import { of } from 'rxjs';
// import { Optional, Required } from '@juneil/tschema';
// import { ServerResponse } from 'http';
// import { HttpResponse } from '../../../src/httpserver/route';
// import { isHTTPService, CallResponse, HTTPParams } from '../../../src/core/httpservice';
// import { tap } from 'rxjs/operators';
// // import { HttpServer, FastifyServer } from '../../../src/httpserver/extension';
// // import { Extension } from '../../../src/core/extensions';
// // import { of } from 'rxjs';
// // import { delay } from 'rxjs/operators';
// // import { Route, Get, Post, Lifecycle, Hook } from '../../../src/httpserver/decorators';
// // import { Property, Required } from '@juneil/tschema';

// export class Configurator extends Extension<any> {

//     static type = ExtensionType.CONFIGURATOR;

//     onLoad() {
//         return this.setValue({
//             HttpServer: {
//                 port: 8888
//             }
//         });
//     }

//     onBuild() {}
//     onShutdown() {}
// }

// export class Logger extends Extension<any> {
//     // constructor() { super(); }

//     static type = ExtensionType.LOGGING;

//     onLoad() {
//         const value = {
//             debug: console.log,
//             info: console.log,
//             warn: console.log,
//             error: console.log,
//             fatal: console.log
//         };
//         return this.setValue(value);
//     }
//     onBuild() {}
//     onShutdown() {}
// }

// // class Weird extends Extension<number> {
// //     onLoad() {
// //         return of(this.loadedResult(1)).pipe(delay(10));
// //     }
// //     onBuild() { return of(null); }
// //     onShutdown() { return { priority: ExtensionShutdownPriority.IMPORTANT, resolver: of(null) }; }
// // }

// // // @Lib()
// // // class Lib1 {
// // //     constructor(@Inject(Logger) logger: any) {
// // //         logger.info('YO');
// // //     }
// // // }

// // @Injectable()
// // class BDep {
// //     foo() { return 3; }
// // }

// @Service()
// class ADep {
//     foo() { return 1; }
// }

// // @Injectable()
// // class TestService {
// //     constructor(private dep: BDep) {}
// //     foo() { return 'foo lala ' + this.dep.foo(); }
// // }

// // @Injectable()
// // class Isolate {
// //     constructor(@Inject(HttpServer) private server: FastifyServer) {}
// //     yo() {
// //         return this.server.printRoutes();
// //     }
// // }

// // @Route({
// //     path: '/fu'
// // })
// // class RouteC {

// //     constructor(@Inject(HttpServer) private server: FastifyServer, private iso: Isolate) {}

// //     @Get()
// //     yo() {
// //         return this.iso.yo();
// //     }

// // }


// // @Module({
// //     version: '1',
// //     exports: [ TestService ],
// //     declarations: [ RouteC ],
// //     providers: [ Isolate ],
// //     prefix: 'sub'
// // })
// // class SubModule {}


// // class Query {
// //     @Property()
// //     foo: boolean;
// //     @Property()
// //     yolo: number;
// // }

// // class Params {
// //     @Required()
// //     @Property()
// //     id: string;
// // }

// // class Payload {
// //     @Property()
// //     @Required()
// //     name: string;

// //     @Property()
// //     @Required()
// //     description: string;

// //     @Property()
// //     @Required()
// //     option: boolean;
// // }

// // class Value {
// //     @Property()
// //     @Required()
// //     message: string;
// // }

// // @Route({
// //     path: '/:id'
// // })
// // class RouteA {

// //     constructor(private test: TestService) {}

// //     @Get({
// //         query: Query,
// //         params: Params,
// //         response: {
// //             200: Value
// //         }
// //     })
// //     handler(query: Query, params: Params) {
// //         console.log('>>>> A access to route', query, params);
// //         return { message: this.test.foo(), t: true };
// //     }

// // }

// // @Route({
// //     path: '/yolo/:id'
// // })
// // class RouteB {

// //     @Post({
// //         params: Params,
// //         payload: Payload
// //     })
// //     handler(payload: Payload, params: Params) {
// //         console.log('>>>> B access to route', params, payload);
// //         return payload;
// //     }

// // }

// // @Lifecycle()
// // class MyLC {

// //     @Hook({ name: 'request' })
// //     request1() {}
// //     @Hook({ name: 'request' })
// //     request2() {}

// // }



// // @Module({
// //     version: '1',
// //     declarations: [ RouteA, RouteB, MyLC ],
// //     providers: [ ADep ],
// //     imports: [ SubModule ]
// // })
// // class MyMod {
// //     onStart() {
// //         console.log('started...');
// //         // console.log(Reflect.getMetadataKeys(RouteA));
// //         // console.log(Reflect.getMetadata('propMetadata', RouteA));
// //         // console.log(Extension.extractMetadata(RouteA, 'handler'));
// //     }
// // }

// class PK {
//     @Required()
//     public: string;
// }

// const tok = new InjectionToken('test');
// const tok2 = new InjectionToken('test2');
// @Service()
// class GetStuff {
//     constructor(@Inject(tok) private conf: any) {}
//     stuff() {
//         return this.conf;
//     }
// }


// @HTTPService({
//     baseUrl: 'http://wewe:6546'
// })
// class MyService {
//     @Call({
//         path: '/jwt/keys/:yo',
//         response: PK
//     })
//     publicKey: (params?: HTTPParams) => CallResponse<PK>;
// }

// class Query {
//     @Required()
//     toto: string;
// }

// class Param {
//     @Required()
//     id: string;
// }

// @Route({ path: '/:id' })
// class Route1 {
//     constructor(private req: HttpServerRequest, private t: MyService) {}
//     @Get({ query: Query })
//     get(query: Query) {
//         console.log('HANDLER', this.t.publicKey({ query: { a: '0'}, params: { yo: 'xxx' } }), this.req.id, query);
//         return 11;
//     }

//     @Delete({ query: Query })
//     delete(q: Query) {
//         console.log('HANDLER DEL', q);
//         return null;
//     }

//     @Post({ query: Query, params: Param })
//     pp(p: Param, q: Query) {
//         console.log('HANDLER POST', q, p);
//         return 'post';
//     }
// }

// @Lifecycle()
// class LC {
//     constructor(private req: HttpServerRequest) {}
//     @Hook({ name: 'request' })
//     request() {
//         console.log('>>>>>>>', this.req.id, this.req.raw.url);
//     }

//     @Hook({ name: 'response' })
//     request4(res: ServerResponse) {
//         console.log('<<<<<<<', this.req.id, this.req.raw.url, res.statusCode);
//     }
// }



// @Module({
//     version: 'x',
//     providers: [ GetStuff ],
//     exports: [ GetStuff ]
// })
// class StaticStuff {
//     static setConfig(data) {
//         return { module: StaticStuff, providers: [{ provide: tok, useValue: data }] };
//     }
// }

// @Module({
//     version: 'x',
//     components: [Route1, LC],
//     providers: [MyService, ADep, { provide: tok2, useValue: 1 }],
//     imports: [ StaticStuff.setConfig('zz') ]
// })
// class MyMod {
//     onStart() {
//         console.log('STARTED');
//     }
// }
@Lifecycle()
class LC {
    @Hook({name: 'authentication'})
    handle() {
        return throwError(Biim.gatewayTimeout());
    }
}

class Iteme {
    @Required()
    foo: number;
}
class Payload {
    @Required()
    id: string;
    @Optional()
    @Enum('yo', 'lo')
    name: string;
    @Required()
    @Item(Iteme)
    numbers: Iteme[];
    @Required()
    item: Iteme;
}

@Route({ path: '/', auth: true })
class Route1 {
    @Post()
    post(p: Payload) {
        return throwError(Biim.unauthorized());
    }
}

@Module({
    version: '1',
    components: [Route1, LC]
})
class MyMod {}

Hapiness.bootstrap(MyMod, [ HttpServer ],
    { retry: { interval: 100, count: 2 } })
.catch(err => console.log(err));
