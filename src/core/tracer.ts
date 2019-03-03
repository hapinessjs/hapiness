import { Tracer, Span, SpanContext, FORMAT_HTTP_HEADERS } from 'opentracing';

export class CoreTrace {

    private tracer: Tracer;
    private root: Span;

    static newCoreTraceFromHTTPRequest(tracer: Tracer, operation: string, carrier: any): CoreTrace {
        const ctx = tracer.extract(FORMAT_HTTP_HEADERS, carrier);
        return new CoreTrace(tracer, operation, ctx);
    }

    constructor(tracer: Tracer, operation: string, parent?: Span | SpanContext) {
        this.tracer = tracer;
        this.root = this.tracer.startSpan(operation, { childOf: parent });
    }

    trace(operation: string): CoreTrace {
        return new CoreTrace(this.tracer, operation, this.root);
    }

    finish() {
        this.root.finish();
    }

    toHTTPHeaders(): {[key: string]: string} {
        const carrier = {};
        this.tracer.inject(this.root, FORMAT_HTTP_HEADERS, carrier);
        return carrier;
    }

}
