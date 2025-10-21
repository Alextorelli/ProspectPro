// Example edge function for test validation
export default function handler(req: Request) {
  return new Response(JSON.stringify({ hello: "world" }), {
    headers: { "Content-Type": "application/json" },
  });
}
