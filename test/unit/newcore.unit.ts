import { Hapiness } from '../../src/core/bootstrap';
import { HapinessModule, Inject, Injectable, InjectionToken } from '../../src/core/decorators';
import { CoreModuleWithProviders, ModuleManager } from '../../src/core/module';
import { HttpServer } from '../../src/extensions/http-server';
import { Lifecycle, Route } from '../../src/extensions/http-server/decorators';
import { SocketServer } from '../../src/extensions/socket-server/extension';
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

        @Injectable()
        class Prov {
            private toto: number;
            constructor(@Optional() @Inject(CONFIG) private conf) {
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
            constructor(private pr: Prov, @Inject(HttpServer) private server: Server) {}
            onGet(request, reply) {
                reply(this.pr.getData());
            }
            onPreResponse(request, reply) {
                console.log('PRERESPONSE', this.server.info.uri);
                reply.continue();
            }
        }

        @HapinessModule({
            version: '1',
            declarations: [ MySubRoute ],
            providers: [ Prov ]
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
            onError(err) {
                console.warn(err.message);
            }
        }

        Hapiness.bootstrap(Module,
            [
                HttpServer.setConfig({ host: '0.0.0.0', port: 4444 }),
                SocketServer.setConfig({ port: 4555 })
            ])
            .then(_ => {
                Hapiness['extensions'][0].value.inject('/sub', res => {
                    console.log('----', res.result);
                    done();
                })
            })
            .catch(_ => done(_));

    }
}

