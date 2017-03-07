import { OnError, OnRegister, OnStart } from '../../../src/module/hook';
import { Injectable, HapinessModule } from '../../../src';

export class Logger {
    log(str: string) { return str; }
}

@Injectable()
export class LoggerWrapper {

    constructor(private logger: Logger) {}

    log(str: string) { return this.logger.log(str); }
}

@HapinessModule({
    version: '1.0.0'
})
export class SubSubModule {}

@HapinessModule({
    version: '1.0.0'
})
export class SubModule {}

@HapinessModule({
    version: '1.0.0',
    imports: [SubSubModule]
})
export class SubModuleWithImports {}

@HapinessModule({
    version: '1.0.0',
    options: { host: '0.0.0.0', port: 4443 },
    providers: [Logger, LoggerWrapper],
    imports: [SubModule, SubModuleWithImports]
})
export class TestModule {

    constructor(private loggerWrapper: LoggerWrapper) {}

    logStuff(str: string) {
        return this.loggerWrapper.log(str);
    }
}

@HapinessModule({
    version: '1.0.0',
    options: { test: 'test' }
})
export class ModuleOnStart implements OnStart, OnRegister {
    onStart() {}
    onRegister() {}
}
