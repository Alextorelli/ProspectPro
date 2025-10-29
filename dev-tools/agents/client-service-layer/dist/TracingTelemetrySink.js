import { SpanStatusCode, trace } from "@opentelemetry/api";
export class TracingTelemetrySink {
    constructor(options) {
        this.tracer = trace.getTracer(options.tracerName || options.serviceName, options.serviceVersion || "1.0.0");
    }
    info(message, properties) {
        const span = this.getCurrentSpan();
        if (span) {
            span.addEvent("info", {
                message,
                ...properties,
            });
        }
        console.log(`[INFO] ${message}`, properties);
    }
    warn(message, properties) {
        const span = this.getCurrentSpan();
        if (span) {
            span.addEvent("warning", {
                message,
                ...properties,
            });
        }
        console.warn(`[WARN] ${message}`, properties);
    }
    error(message, error, properties) {
        const span = this.getCurrentSpan();
        if (span) {
            span.recordException(error || new Error(message));
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message,
            });
            span.addEvent("error", {
                message,
                error: error?.message,
                stack: error?.stack,
                ...properties,
            });
        }
        console.error(`[ERROR] ${message}`, error, properties);
    }
    event(event) {
        const span = this.getCurrentSpan();
        if (span) {
            span.addEvent(event.name, event.properties || {});
        }
        console.log(`[EVENT] ${event.name}`, event.properties);
    }
    // Create a new span for a specific operation
    startSpan(name, attributes) {
        return this.tracer.startSpan(name, {
            attributes: attributes || {},
        });
    }
    // Get the currently active span
    getCurrentSpan() {
        return trace.getActiveSpan();
    }
}
//# sourceMappingURL=TracingTelemetrySink.js.map