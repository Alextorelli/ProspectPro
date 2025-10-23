import { Span } from "@opentelemetry/api";
export interface TracingTelemetrySinkOptions {
    serviceName: string;
    serviceVersion?: string;
    tracerName?: string;
}
export declare class TracingTelemetrySink {
    private tracer;
    constructor(options: TracingTelemetrySinkOptions);
    info(message: string, properties?: Record<string, any>): void;
    warn(message: string, properties?: Record<string, any>): void;
    error(message: string, error?: Error, properties?: Record<string, any>): void;
    event(event: {
        name: string;
        properties?: Record<string, any>;
    }): void;
    startSpan(name: string, attributes?: Record<string, any>): Span;
    private getCurrentSpan;
}
//# sourceMappingURL=TracingTelemetrySink.d.ts.map