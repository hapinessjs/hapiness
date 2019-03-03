import { Optional, Inject, Injectable } from 'injection-js';
import { TokenDI } from './tokens';
import { InternalLogger } from '../logger';
import { ExtensionConfig } from './interfaces';

export interface ExtensionLogger {
    trace(...any): void;
    debug(...any): void;
    info(...any): void;
    warn(...any): void;
    error(...any): void;
    fatal(...any): void;
}

@Injectable()
export class ExtensionLogger {

    private debug_logger: InternalLogger;

    constructor(
        @Optional() @Inject(TokenDI('logger')) private logger: ExtensionLogger,
        @Inject(ExtensionConfig) config: ExtensionConfig
    ) {
        if (!this.logger) {
            this.debug_logger = new InternalLogger('extension', config.extension_name.toLowerCase());
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
