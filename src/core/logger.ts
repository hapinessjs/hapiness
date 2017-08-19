import * as Debug from 'debug';

export class InternalLogger {

    private logger;

    /* istanbul ignore next */
    constructor(private tag = 'core', extension?: string) {
        this.logger = Debug(extension ? `hapiness:${extension}` : 'hapiness');
    }

    /* istanbul ignore next */
    debug(message: string): void {
        this.logger(`[${this.tag.toUpperCase()}] > ${message}`);
    }

}
