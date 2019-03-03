import { Hapiness, Module } from '../../../src/core';
import { HttpServer } from '../../../src/extensions/http-server-2/extension';
import { Extension, ExtensionType } from '../../../src/core/extensions';
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






@Module({ version: '1' })
class MyMod {}
// NOT ENOUGH... SHOULD PROVIDE TYPE IN THE EXTENSION IMPLEMENTATION
Hapiness.bootstrap(MyMod, [ HttpServer, Logger.setConfig({ type: ExtensionType.LOGGING }) ])
.catch(err => console.log(err));
