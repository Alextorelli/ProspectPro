import { Span, SpanStatusCode, trace } from "@opentelemetry/api";

export interface TracingTelemetrySinkOptions {
  serviceName: string;
  serviceVersion?: string;
  tracerName?: string;
}

export class TracingTelemetrySink {
  private tracer;

  constructor(options: TracingTelemetrySinkOptions) {
    this.tracer = trace.getTracer(
      options.tracerName || options.serviceName,
      options.serviceVersion || "1.0.0"
    );
  }

  info(message: string, properties?: Record<string, any>): void {
    const span = this.getCurrentSpan();
    if (span) {
      span.addEvent("info", {
        message,
        ...properties,
      });
    }
    console.log(`[INFO] ${message}`, properties);
  }

  warn(message: string, properties?: Record<string, any>): void {
    const span = this.getCurrentSpan();
    if (span) {
      span.addEvent("warning", {
        message,
        ...properties,
      });
    }
    console.warn(`[WARN] ${message}`, properties);
  }

  error(
    message: string,
    error?: Error,
    properties?: Record<string, any>
  ): void {
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

  event(event: { name: string; properties?: Record<string, any> }): void {
    const span = this.getCurrentSpan();
    if (span) {
      span.addEvent(event.name, event.properties || {});
    }
    console.log(`[EVENT] ${event.name}`, event.properties);
  }

  // Create a new span for a specific operation
  startSpan(name: string, attributes?: Record<string, any>): Span {
    return this.tracer.startSpan(name, {
      attributes: attributes || {},
    });
  }

  // Get the currently active span
  private getCurrentSpan(): Span | undefined {
    return trace.getActiveSpan();
  }
}
