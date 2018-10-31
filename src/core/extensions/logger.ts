import { Optional, Inject } from 'injection-js';
import { TokenDI } from './tokens';
import { InternalLogger } from '../logger';

export interface ExtensionLogger {
    trace(...any): void;
    debug(...any): void;
    info(...any): void;
    warn(...any): void;
    error(...any): void;
    fatal(...any): void;
}

export class ExtensionLogger {

    private debug_logger: InternalLogger;

    constructor(@Optional() @Inject(TokenDI('logger')) private logger: ExtensionLogger) {
        if (!this.logger) {
            this.debug_logger = new InternalLogger();
        }
    }

    private handler(level: string, ...any) {
        if (this.logger) {
            Reflect.apply(this.logger[level], this.logger, any);
        } else {
            this.debug_logger.debug(any.shift());
        }
    }

    trace(...any): void { this.handler('trace', ...any) }
    debug(...any): void { this.handler('debug', ...any) }
    info(...any): void { this.handler('info', ...any) }
    warn(...any): void { this.handler('warn', ...any) }
    error(...any): void { this.handler('error', ...any) }
    fatal(...any): void { this.handler('fatal', ...any) }
}
