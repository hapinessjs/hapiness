import { Tracer, Span, SpanContext, FORMAT_HTTP_HEADERS } from 'opentracing';

/**
 * Used to trace processes using the `opentracing` lib.
 *
 * Can be instantiated from HTTP request headers to link it
 * with another process coming from an other service.
 *
 * Can be injected to a HTTP request to link it
 * with another process coming from an other service.
 */
export class CoreTrace {

    private tracer: Tracer;
    private root: Span;

    /**
     * Extract span context and link it to a new trace
     */
    static newFromCarrier(tracer: Tracer, operation: string, carrier: any): CoreTrace {
        const ctx = tracer.extract(FORMAT_HTTP_HEADERS, carrier);
        return new CoreTrace(tracer, operation, ctx);
    }

    constructor(tracer: Tracer, operation: string, parent?: Span | SpanContext) {
        this.tracer = tracer;
        this.root = this.tracer.startSpan(operation, { childOf: parent });
    }

    /**
     * Create a sub trace
     */
    trace(operation: string): CoreTrace {
        return new CoreTrace(this.tracer, operation, this.root);
    }

    /**
     * Close the trace
     */
    finish() {
        this.root.finish();
    }

    /**
     * Export the trace to
     * HTTP Headers format
     */
    toHTTPHeaders(): {[key: string]: string} {
        const carrier = {};
        this.tracer.inject(this.root, FORMAT_HTTP_HEADERS, carrier);
        return carrier;
    }

}
