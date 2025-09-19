import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Edge Functions URL
export const EDGE_FUNCTIONS_URL =
  import.meta.env.VITE_EDGE_FUNCTIONS_URL || `${supabaseUrl}/functions/v1`;

// Edge Function endpoints
export const EDGE_FUNCTIONS = {
  ENHANCED_BUSINESS_DISCOVERY: `${EDGE_FUNCTIONS_URL}/enhanced-business-discovery`,
  LEAD_VALIDATION: `${EDGE_FUNCTIONS_URL}/lead-validation-edge`,
  BUSINESS_DISCOVERY: `${EDGE_FUNCTIONS_URL}/business-discovery-edge`,
  DIAGNOSTICS: `${EDGE_FUNCTIONS_URL}/diag`,
} as const;
