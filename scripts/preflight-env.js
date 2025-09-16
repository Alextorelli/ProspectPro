#!/usr/bin/env node
/**
 * Preflight environment validator for ProspectPro.
 * Exits non-zero if critical configuration is missing or obviously misconfigured.
 */
const REQUIRED = ['SUPABASE_URL'];
const KEY_CANDIDATES = [
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'
];

let ok = true;

for (const v of REQUIRED) {
  if (!process.env[v]) {
    console.error(`❌ Missing required env: ${v}`);
    ok = false;
  }
}

const keyFound = KEY_CANDIDATES.find(k => process.env[k]);
if (!keyFound) {
  console.error('❌ No Supabase key found. Provide SUPABASE_SECRET_KEY for server operations.');
  ok = false;
} else {
  console.log(`✅ Using Supabase key source: ${keyFound}`);
  if (/PUBLISHABLE|ANON/.test(keyFound)) {
    console.warn('⚠️  Using a public key (publishable/anon). RLS-protected table access may fail.');
  }
}

if (!ok) {
  console.error('Preflight failed. See messages above.');
  process.exit(1);
} else {
  console.log('Preflight environment validation passed.');
}
