# Supabase Edge Functions

This document explains how ProspectPro uses Supabase Edge Functions for backend logic as part of the Lovable + Supabase migration.

## Overview

- Runtime: Deno on Supabase Edge Functions
- Location: `supabase/functions/*`
- Shared utilities: `supabase/functions/_shared/*`

## Local Development

- CLI serve (recommended):
  - `supabase functions serve diag`
  - `supabase functions serve business-discovery`
- Direct Deno run (quick lint/smoke):
  - `deno task run:diag`
  - `deno task run:discovery`

## Invoking from Frontend

Use the Supabase JS client:

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const { data, error } = await supabase.functions.invoke('business-discovery', {
  body: { query: 'roofing contractors', location: 'San Diego' },
})
```

## Environment Variables

Configure in Supabase project settings:

- `GOOGLE_PLACES_API_KEY`
- `HUNTER_IO_API_KEY`
- `NEVERBOUNCE_API_KEY`
- `SCRAPINGDOG_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (only accessible to privileged service contexts; never expose to client)

## Zero Fake Data Policy

- Edge Functions must never generate or return fabricated business data.
- If an external API fails, return an error and stop; do not fallback to mock content.

## Deployment

- Login and link: `supabase login`; `supabase link --project-ref <project-ref>`
- Deploy function(s): `supabase functions deploy <name>`

## Testing

- Invoke from CLI: `supabase functions invoke diag --no-verify-jwt --body '{"ping":true}'`
- Add integration tests under `tests/integration/` for function contracts and validation logic.
