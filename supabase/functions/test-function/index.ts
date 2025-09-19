import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
    console.log("Test function called");

    return new Response(
        JSON.stringify({ message: "Test function working!" }),
        { headers: { "Content-Type": "application/json" } },
    );
});
