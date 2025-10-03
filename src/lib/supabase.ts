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

// Edge Function endpoints for vault-secured progressive enrichment
export const EDGE_FUNCTIONS = {
  // Progressive Enrichment Orchestrator (vault-secured)
  ENRICHMENT_ORCHESTRATOR: `${EDGE_FUNCTIONS_URL}/enrichment-orchestrator`,

  // Individual enrichment services (vault-secured)
  ENRICHMENT_BUSINESS_LICENSE: `${EDGE_FUNCTIONS_URL}/enrichment-business-license`,
  ENRICHMENT_PDL: `${EDGE_FUNCTIONS_URL}/enrichment-pdl`,
  ENRICHMENT_HUNTER: `${EDGE_FUNCTIONS_URL}/enrichment-hunter`,
  ENRICHMENT_NEVERBOUNCE: `${EDGE_FUNCTIONS_URL}/enrichment-neverbounce`,

  // Legacy endpoints (for backward compatibility)
  ENHANCED_BUSINESS_DISCOVERY: `${EDGE_FUNCTIONS_URL}/enhanced-business-discovery`,
  LEAD_VALIDATION: `${EDGE_FUNCTIONS_URL}/lead-validation-edge`,
  BUSINESS_DISCOVERY: `${EDGE_FUNCTIONS_URL}/business-discovery-edge`,
  DIAGNOSTICS: `${EDGE_FUNCTIONS_URL}/diag`,
} as const;

// Progressive Enrichment Tiers (90% cost reduction vs competitors)
export const ENRICHMENT_TIERS = {
  STARTER: {
    name: "Starter",
    price: 0.5,
    stages: ["business-license", "company-enrichment"],
    description: "Basic business validation and company data",
  },
  PROFESSIONAL: {
    name: "Professional",
    price: 1.5,
    stages: ["business-license", "company-enrichment", "email-discovery"],
    description: "Business validation + verified email discovery",
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 3.5,
    stages: [
      "business-license",
      "company-enrichment",
      "email-discovery",
      "email-verification",
    ],
    description: "Complete enrichment + email verification",
  },
  COMPLIANCE: {
    name: "Compliance",
    price: 7.5,
    stages: [
      "business-license",
      "company-enrichment",
      "email-discovery",
      "email-verification",
      "person-enrichment",
    ],
    description: "Full compliance-grade enrichment with person data",
  },
} as const;
