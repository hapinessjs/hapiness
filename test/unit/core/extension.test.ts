import 'reflect-metadata';
import { HttpServer } from '../../../src/extensions/http-server-2/extension';
import { Extension } from '../../../src/core/extensions';
import { HapinessModule, Hapiness } from '../../../src';
import { of } from 'rxjs';

export class Logger extends Extension<any> {
    // constructor() { super(); }
    onLoad() {
        const value = {
            debug: console.log,
            info: console.log,
            warn: console.log,
            error: console.log,
            fatal: console.log
        }
        return of(this.loadedResult(value));
    }
    onBuild() { return of(null) }
    onShutdown() { return of(null) }
}

test('Test !', () => {

    @HapinessModule({ version: 'x' })
    class MyModule {
        onStart() {
            console.log('STARTED');
        }
    }

    Hapiness.bootstrap(MyModule, [
        Logger.setConfig({ type: 'logger' }),
        HttpServer.setConfig({ host: '0.0.0.0', port: 8080 })
    ]).catch(_ => console.log('ERR', _));

    // @Injectable()
    // class Toto {
    //     constructor(@Inject('a') prop: string) {
    //         console.log('1111111111111', prop)
    //     }
    // }

    // class AbsToto {
    //     constructor(@Inject('a') prop: string) {
    //         console.log('222222222222', prop)
    //     }
    // }


    // @Injectable()
    // class Toto2 extends AbsToto {

    // }

    // DependencyInjection.createAndResolve([{provide: 'a', useValue: 'hello'}])
    //     .subscribe(di => {

    //         DependencyInjection.instantiateComponentSync(Toto, di);
    //         DependencyInjection.instantiateComponentSync(Toto2, di);

    //         done();
    //     });

    // const instance = HttpServer.instantiate();

    // console.log(HttpServer)

    // console.log(HttpServer.setConfig({}));

    // instance.onLoad(<any>{}).subscribe(_ => {
    //     console.log(_.value ? 'VALUE OK' : 'NOK')
    //     console.log(instance['value'] ? 'VALUE OK' : 'NOK')
    // });
})
