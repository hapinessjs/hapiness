import { Hapiness, Module, Lib, Inject, ExtensionShutdownPriority, ExtensionType, Injectable } from '../../../src/core';
import { HttpServer } from '../../../src/extensions/http-server-2/extension';
import { Extension } from '../../../src/core/extensions';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';


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

@Lib()
class Lib1 {
    constructor(@Inject(Logger) logger: any) {
        logger.info('YO');
    }
}

@Injectable()
class BDep {
    foo() { return 3; }
}

@Injectable()
class ADep {
    constructor(public dep: BDep) {}
    foo() { return 1 + this.dep.foo(); }
}

@Injectable()
class TestService {
    constructor(private dep: ADep) {}
    foo() { return 'foo lala ' + this.dep.foo(); }
}

@Module({ version: '1', exports: [ TestService ]})
class SubModule {}

@Module({ version: '1', declarations: [ Lib1 ], imports: [ SubModule ] })
class MyMod {
    constructor(private test: TestService) {}
    onStart() {
        console.log(this.test.foo());
    }
}
// NOT ENOUGH... SHOULD PROVIDE TYPE IN THE EXTENSION IMPLEMENTATION
Hapiness.bootstrap(MyMod, [ HttpServer, Logger, Weird.setConfig({ uri: 'uri://yolo:99' }) ], { retry: { interval: 100, count: 2 } })
.catch(err => console.log(err));

