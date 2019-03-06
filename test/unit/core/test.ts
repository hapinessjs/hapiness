import { Hapiness, Module, Lib, Inject } from '../../../src/core';
import { HttpServer } from '../../../src/extensions/http-server-2/extension';
import { Extension, ExtensionType } from '../../../src/core/extensions';
import { of, throwError } from 'rxjs';
import { flatMap } from 'rxjs/operators';


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
        }
        return of(this.loadedResult(value));
    }
    onBuild() { return of(null) }
    onShutdown() { return of(null) }
}

class Weird extends Extension<number> {
    onLoad() {
        return of(this.loadedResult(1)).pipe(flatMap(() => throwError(new Error('Undefined error'))));
    }
    onBuild() { return of(null) }
    onShutdown() { return of(null) }
}

@Lib()
class Lib1 {
    constructor(@Inject(Logger) logger: any) {
        logger.info('YO PD')
    }
}


@Module({ version: '1', declarations: [ Lib1 ] })
class MyMod {}
// NOT ENOUGH... SHOULD PROVIDE TYPE IN THE EXTENSION IMPLEMENTATION
Hapiness.bootstrap(MyMod, [ HttpServer, Logger, Weird ])
.catch(err => console.log(err));
