// deno-lint-ignore-file no-explicit-any
export function json(data: any, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function error(message: string, status = 400, extra?: Record<string, any>) {
  return json({ error: message, ...(extra ?? {}) }, { status });
}
