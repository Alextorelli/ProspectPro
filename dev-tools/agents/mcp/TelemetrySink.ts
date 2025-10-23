export interface TelemetryEvent {
  name: string;
  properties?: Record<string, any>;
  measurements?: Record<string, number>;
}

export interface TelemetrySink {
  info(message: string, properties?: Record<string, any>): void;
  warn(message: string, properties?: Record<string, any>): void;
  error(message: string, error?: Error, properties?: Record<string, any>): void;
  event(event: TelemetryEvent): void;
}

export class NoOpTelemetrySink implements TelemetrySink {
  info(message: string, properties?: Record<string, any>): void {
    // No-op
  }

  warn(message: string, properties?: Record<string, any>): void {
    // No-op
  }

  error(
    message: string,
    error?: Error,
    properties?: Record<string, any>
  ): void {
    // No-op
  }

  event(event: TelemetryEvent): void {
    // No-op
  }
}
