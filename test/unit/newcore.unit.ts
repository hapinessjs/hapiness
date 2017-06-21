import { Hapiness } from '../../src/core/bootstrap';
import { HapinessModule, Inject, Injectable, InjectionToken } from '../../src/core/decorators';
import { CoreModuleWithProviders, ModuleManager } from '../../src/core/module';
import { HttpServerExt } from '../../src/extensions/http-server';
import { Lifecycle, Route } from '../../src/extensions/http-server/decorators';
import { SocketServerExt } from '../../src/extensions/socket-server/extension';
import { Optional } from '../../src/externals/injection-js';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import { only, suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { RouteConfiguration, Server } from 'hapi';

@only
@suite('NEW')
class NEW {
    @test('----')
    testNew(done) {

        const CONFIG = new InjectionToken('toto');

        class ServB {}

        @Injectable()
        class Prov {
            private toto: number;
            constructor(@Inject(CONFIG) private conf) {
                this.toto = 123;
            }
            getData() {
                return {
                    data: 'test',
                    conf: this.conf,
                    toto: this.toto
                };
            }
        }

        @Route({
            path: '/',
            method: 'get'
        })
        class MyRoute {
            onGet(request, reply) {
                reply('toto');
            }
            onPreAuth(request, reply) {
                console.log('PREAUTH');
                reply.continue();
            }
        }

        @Route({
            path: '/sub',
            method: 'get'
        })
        class MySubRoute {
            constructor(private pr: Prov, @Inject(HttpServerExt) private server: Server) {}
            onGet(request, reply) {
                reply(this.pr.getData());
            }
            onPreResponse(request, reply) {
                console.log('PRERESPONSE', this.server.info.uri);
                reply.continue();
            }
        }

        @Injectable()
        class ExSe {
            constructor(private prov: Prov) {}
            getData() { return 'data'; }
        }

        @HapinessModule({
            version: '1',
            declarations: [ MySubRoute ],
            providers: [ Prov ],
            exports: [ Prov ]
        })
        class SubMod {
            static setConfig(config: any): CoreModuleWithProviders {
                return {
                    module: SubMod,
                    providers: [{ provide: CONFIG, useValue: config }]
                };
            }
            onRegister() {
                console.log('REGISTER');
            }
        }

        @Lifecycle({
            event: 'onPreHandler'
        })
        class LFC {
            onEvent(request, reply) {
                console.log('PREHANDLER!!!');
                reply.continue();
            }
        }

        @HapinessModule({
            version: '1',
            declarations: [ MyRoute, LFC ],
            imports: [ SubMod.setConfig({ toto: true }) ]
        })
        class Module {

            constructor(private es: Prov) {}

            onError(err) {
                console.warn(err.message);
            }
        }

        Hapiness.bootstrap(Module,
            [
                HttpServerExt.setConfig({ host: '0.0.0.0', port: 4444 }),
                SocketServerExt.setConfig({ port: 4555 })
            ])
            .then(_ => {
                console.log('THEN');
                Hapiness['extensions'][0].value.inject('/sub', res => {
                    console.log('----', res.result);
                    done();
                })
            })
            .catch(_ => {
                done(_);
            });

    }
}

