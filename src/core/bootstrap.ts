import { Tracer } from 'opentracing';
import { Type } from './decorators';
import { Extension } from './extensions';
import { InternalLogger } from './logger';
import { CoreTrace } from './tracer';

export interface BootstrapOptions {
    tracer?: Tracer;
}

export class Hapiness {

    static bootstrap(module: Type<any>, extensions?: Extension<any>[], options?: BootstrapOptions) {
        return bootstrap(module, extensions, options);
    }
}

const logger = new InternalLogger('bootstrap');

function bootstrap(module: Type<any>, extensions?: Extension<any>[], options?: BootstrapOptions) {
    extensions = extensions || [];
    options = options || {};
    options.tracer = options.tracer || new Tracer();
    const trace = new CoreTrace(options.tracer, 'bootstrap');
    logger.debug(`bootstrapping ${module.name}`);
    trace.trace('YOLO').finish();
    trace.finish();
}
