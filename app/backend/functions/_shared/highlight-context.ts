const REQUEST_HEADER = "x-highlight-request";
const TRACE_HEADER = "x-highlight-trace";
const SESSION_HEADER = "x-highlight-session";
const PROJECT_HEADER = "x-highlight-project";
const USER_HEADER = "x-highlight-user";
const ORIGIN_HEADER = "x-highlight-origin";

const FORWARD_HEADER_KEYS = [
  REQUEST_HEADER,
  TRACE_HEADER,
  SESSION_HEADER,
  PROJECT_HEADER,
  USER_HEADER,
  ORIGIN_HEADER,
] as const;

type ForwardHeaderKey = (typeof FORWARD_HEADER_KEYS)[number];

export interface HighlightContext {
  requestId?: string;
  traceId?: string;
  sessionId?: string;
  projectId?: string;
  userId?: string;
  originUrl?: string;
  /** Headers that should be forwarded to downstream requests. */
  forwardHeaders(init?: HeadersInit): Headers;
  /** Apply highlight headers to an outgoing response. */
  applyToResponse<T extends Response>(response: T): T;
  /** Serialize context into a response payload. */
  toJSON(): Record<string, string>;
  /** Consistent log prefix for request scoped logs. */
  logPrefix: string;
  /** Convenience logger utilities with highlight prefix. */
  log: (
    level: "debug" | "info" | "warn" | "error",
    message: string,
    meta?: unknown
  ) => void;
  debug: (message: string, meta?: unknown) => void;
  info: (message: string, meta?: unknown) => void;
  warn: (message: string, meta?: unknown) => void;
  error: (message: string, meta?: unknown) => void;
}

function sanitizeValue(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function applyHighlightHeaders(
  headers: Headers,
  context: HighlightContext
): void {
  if (context.requestId) {
    headers.set(REQUEST_HEADER, context.requestId);
  }
  if (context.traceId) {
    headers.set(TRACE_HEADER, context.traceId);
  }
  if (context.sessionId) {
    headers.set(SESSION_HEADER, context.sessionId);
  }
  if (context.projectId) {
    headers.set(PROJECT_HEADER, context.projectId);
  }
  if (context.userId) {
    headers.set(USER_HEADER, context.userId);
  }
  if (context.originUrl) {
    headers.set(ORIGIN_HEADER, context.originUrl);
  }
}

function selectLogger(level: "debug" | "info" | "warn" | "error") {
  switch (level) {
    case "debug":
      return console.debug.bind(console);
    case "info":
      return console.info.bind(console);
    case "warn":
      return console.warn.bind(console);
    case "error":
    default:
      return console.error.bind(console);
  }
}

function createLogger(prefix: string) {
  return (
    level: "debug" | "info" | "warn" | "error",
    message: string,
    meta?: unknown
  ) => {
    const log = selectLogger(level);
    if (meta !== undefined) {
      log(`${prefix} ${message}`, meta);
    } else {
      log(`${prefix} ${message}`);
    }
  };
}

export function createHighlightContext(req: Request): HighlightContext {
  const headers = req.headers;
  const requestId = sanitizeValue(headers.get(REQUEST_HEADER));
  const traceId = sanitizeValue(headers.get(TRACE_HEADER));
  const sessionId = sanitizeValue(headers.get(SESSION_HEADER));
  const projectId = sanitizeValue(headers.get(PROJECT_HEADER));
  const userId = sanitizeValue(headers.get(USER_HEADER));
  const originUrl = sanitizeValue(
    headers.get(ORIGIN_HEADER) ?? headers.get("referer")
  );

  const forwardRecord = new Map<ForwardHeaderKey, string>();
  FORWARD_HEADER_KEYS.forEach((key) => {
    const value = sanitizeValue(headers.get(key));
    if (value) {
      forwardRecord.set(key, value);
    }
  });

  const basePrefixParts = ["[Highlight"];
  if (projectId) {
    basePrefixParts.push(projectId);
  }
  if (requestId) {
    basePrefixParts.push(`#${requestId}`);
  }
  basePrefixParts.push("]");
  const logPrefix = basePrefixParts.join(" ");

  const log = createLogger(logPrefix);

  return {
    requestId,
    traceId,
    sessionId,
    projectId,
    userId,
    originUrl,
    forwardHeaders(init?: HeadersInit): Headers {
      const next = new Headers(init);
      forwardRecord.forEach((value, key) => {
        next.set(key, value);
      });
      return next;
    },
    applyToResponse<T extends Response>(response: T): T {
      const nextResponse = response;
      applyHighlightHeaders(nextResponse.headers, this);
      return nextResponse;
    },
    toJSON(): Record<string, string> {
      const payload: Record<string, string> = {};
      if (this.requestId) payload.requestId = this.requestId;
      if (this.traceId) payload.traceId = this.traceId;
      if (this.sessionId) payload.sessionId = this.sessionId;
      if (this.projectId) payload.projectId = this.projectId;
      if (this.userId) payload.userId = this.userId;
      if (this.originUrl) payload.originUrl = this.originUrl;
      return payload;
    },
    logPrefix,
    log,
    debug(message: string, meta?: unknown) {
      log("debug", message, meta);
    },
    info(message: string, meta?: unknown) {
      log("info", message, meta);
    },
    warn(message: string, meta?: unknown) {
      log("warn", message, meta);
    },
    error(message: string, meta?: unknown) {
      log("error", message, meta);
    },
  };
}

export function applyHighlightContextToResponse<T extends Response>(
  response: T,
  context: HighlightContext
): T {
  return context.applyToResponse(response);
}

export const highlightHeaders = {
  request: REQUEST_HEADER,
  trace: TRACE_HEADER,
  session: SESSION_HEADER,
  project: PROJECT_HEADER,
  user: USER_HEADER,
  origin: ORIGIN_HEADER,
};
