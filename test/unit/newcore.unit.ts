import { Hapiness } from '../../src/core/bootstrap';
import { HapinessModule } from '../../src/core/decorators';
import { HttpServer } from '../../src/extentions/http-server';
import { Route } from '../../src/extentions/http-server/decorators';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import { test, suite, only } from 'mocha-typescript';
import * as unit from 'unit.js';

@only
@suite('NEW')
class NEW {
    @test('----')
    testNew(done) {

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
            onGet(request, reply) {
                reply('sub');
            }
            onPreResponse(request, reply) {
                console.log('PRERESPONSE');
                reply.continue();
            }
        }

        @HapinessModule({
            version: '1',
            declarations: [ MySubRoute ]
        })
        class SubMod {}

        @HapinessModule({
            version: '1',
            // declarations: [ MyRoute ],
            // imports: [ SubMod ]
        })
        class Module {
            onError(err) {
                console.warn(err.message);
            }
            onStart() {
                console.log('### START');
            }
        }

        Hapiness.bootstrap(Module,
            [
                HttpServer.setConfig({ host: '0.0.0.0', port: 4444 })
            ])
            .then(_ => {
                console.log('DDDDDDDDDDDDDD');
                Hapiness['extentions'][0].instance.inject('/', res => {
                    console.log('----', res.result);
                    done();
                })
            })
            .catch(_ => done(_));

    }
}

