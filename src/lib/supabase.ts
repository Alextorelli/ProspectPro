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

// Helper function to get current session token for Edge Function calls
export const getSessionToken = async (): Promise<string | null> => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error getting session:", error);
    return null;
  }

  // Return the access token (JWT) from the session
  return session?.access_token ?? null;
};

// Helper function to ensure we have a valid session
export const ensureSession = async (): Promise<boolean> => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Failed to read session:", error);
    return false;
  }

  return Boolean(session?.access_token);
};

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

// Progressive Enrichment Tiers - Consolidated to 3 Tiers
export const ENRICHMENT_TIERS = {
  BASE: {
    name: "Base",
    price: 0.15, // Essential Business Data
    stages: ["business-verification", "company-data"],
    description:
      "Essential Business Data - Perfect for targeted outreach campaigns",
    features: [
      "Business verification",
      "Company data (name, industry, size)",
      "Phone & address validation",
      "Generic company email",
    ],
    badge: "Most Popular",
    hasOwnershipData: false,
  },
  PROFESSIONAL: {
    name: "Professional",
    price: 0.45, // Enhanced Sales Intelligence
    stages: [
      "business-verification",
      "company-data",
      "email-discovery",
      "email-verification",
    ],
    description:
      "Enhanced Sales Intelligence - Verified contacts for higher conversion rates",
    features: [
      "Everything in Base",
      "Professional email discovery & verification",
      "Email deliverability verification",
      "Enhanced company enrichment",
    ],
    badge: "",
    hasOwnershipData: false,
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 2.5, // Premium Executive Access
    stages: [
      "business-verification",
      "company-data",
      "email-discovery",
      "email-verification",
      "executive-enrichment",
      "compliance-verification",
    ],
    description:
      "Premium Executive Access - Compliance-grade data with C-suite contacts",
    features: [
      "Everything in Professional",
      "Executive contact enrichment",
      "Full compliance verification",
      "Advanced data validation",
    ],
    badge: "Premium",
    hasOwnershipData: true,
  },
} as const;
