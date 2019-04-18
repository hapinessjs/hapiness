import * as Debug from 'debug';

export class InternalLogger {

    private logger;

    constructor(private tag = 'core', extension?: string) {
        this.logger = Debug(extension ? `hapiness:${extension}` : 'hapiness');
    }

    private handler(message: string): void {
        this.logger(`[${this.tag.toUpperCase()}] > ${message}`);
    }

    trace(msg): void { this.handler(msg); }
    debug(msg): void { this.handler(msg); }
    info(msg): void { this.handler(msg); }
    warn(msg): void { this.handler(msg); }
    error(msg): void { this.handler(msg); }
    fatal(msg): void { this.handler(msg); }
}
