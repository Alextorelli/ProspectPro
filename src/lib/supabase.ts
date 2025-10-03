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

// Progressive Enrichment Tiers (Actual API costs)
export const ENRICHMENT_TIERS = {
  STARTER: {
    name: "Starter",
    price: 0.034, // Google Places API cost per search
    stages: ["business-license", "company-enrichment"],
    description: "Basic business validation and company data",
    hasOwnershipData: false,
  },
  PROFESSIONAL: {
    name: "Professional",
    price: 0.076, // Google Places + Hunter.io ($0.034 + $0.042 average)
    stages: ["business-license", "company-enrichment", "email-discovery"],
    description: "Business validation + verified email discovery",
    hasOwnershipData: false,
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 0.118, // Google Places + Hunter.io + NeverBounce ($0.034 + $0.042 + $0.042)
    stages: [
      "business-license",
      "company-enrichment",
      "email-discovery",
      "email-verification",
    ],
    description: "Complete enrichment + email verification",
    hasOwnershipData: false,
  },
  COMPLIANCE: {
    name: "Compliance",
    price: 1.118, // All above + Apollo.io ($0.118 + $1.00)
    stages: [
      "business-license",
      "company-enrichment",
      "email-discovery",
      "email-verification",
      "person-enrichment",
    ],
    description: "Full compliance-grade enrichment with executive contacts",
    hasOwnershipData: true,
  },
} as const;
