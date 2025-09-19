# Supabase Edge Functions and Local Dev

This folder contains Edge Functions and configuration to run locally with the Supabase CLI and deploy to your Supabase project.

## Prerequisites

- Supabase CLI installed
- Deno runtime (CLI will install it in container; local Windows users can install from deno.land)
- Project linked: `supabase link --project-ref <ref>`

## Functions

- `diag` — returns sanitized environment diagnostics
- `business-discovery` — entry stub for Google Places discovery (no fake data)
- `lead-enrichment` — enrichment/validation orchestrator (scaffolded)

## Local Run

```powershell
# From project root on Windows PowerShell
supabase functions serve diag --no-verify-jwt
supabase functions serve business-discovery --no-verify-jwt
supabase functions serve lead-enrichment --no-verify-jwt
```

## Deploy

```powershell
supabase functions deploy diag
supabase functions deploy business-discovery
supabase functions deploy lead-enrichment
```

## Environment Variables

Set in Supabase Dashboard → Project Settings → Functions:

- `GOOGLE_PLACES_API_KEY`
- `HUNTER_IO_API_KEY`
- `NEVERBOUNCE_API_KEY`
- `SCRAPINGDOG_API_KEY`

Never include secrets in code or client apps.
