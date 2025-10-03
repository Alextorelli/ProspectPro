// Business Discovery Types
export interface BusinessLead {
  id: string;
  business_name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  industry?: string;
  confidence_score: number;
  validation_status: "pending" | "validating" | "validated" | "failed";
  created_at: string;
  cost_to_acquire: number;
  data_sources: string[];
  // Progressive enrichment fields
  enrichment_tier?: string;
  vault_secured?: boolean;
}

export interface CampaignConfig {
  search_terms: string;
  location: string;
  business_type?: string;
  budget_limit: number;
  max_results: number;
  include_email_validation: boolean;
  include_website_validation: boolean;
  min_confidence_score: number;
  chamber_verification?: boolean;
  trade_association?: boolean;
  professional_license?: boolean;
}

export interface ValidationResult {
  field: string;
  is_valid: boolean;
  confidence: number;
  source: string;
  details?: string;
}

export interface CampaignResult {
  campaign_id: string;
  status: "running" | "completed" | "failed" | "cancelled";
  progress: number;
  total_cost: number;
  leads_found: number;
  leads_qualified: number;
  leads_validated: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  // Progressive enrichment fields
  tier_used?: string;
  vault_secured?: boolean;
  cache_performance?: {
    cache_hits: number;
    cache_misses: number;
    cache_hit_ratio: number;
    cost_savings: number;
  };
}

// Census Intelligence Types
export interface CensusIntelligence {
  business_density: {
    total_establishments: number;
    density_score: number;
    confidence_multiplier: number;
  };
  geographic_optimization: {
    optimal_radius: number;
    expected_results: number;
    api_efficiency_score: number;
  };
  market_insights: {
    market_density: "High" | "Medium" | "Low";
    competition_level: "High" | "Medium" | "Low";
    search_optimization: string;
  };
}

// API Response Types
export interface EdgeFunctionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cost?: number;
  processing_time?: number;
}

export interface BusinessDiscoveryResponse {
  businesses: BusinessLead[];
  total_cost: number;
  processing_time: string;
  campaign_id: string;
  qualified_count: number;
  total_found: number;
  census_intelligence?: CensusIntelligence;
  // Progressive enrichment fields (vault-secured)
  tier_used?: string;
  cache_performance?: {
    cache_hits: number;
    cache_misses: number;
    cache_hit_ratio: number;
    cost_savings: number;
  };
  vault_status?: string;
  stage_progress?: number;
  current_stage?: string;
}

// Store Types
export interface CampaignStore {
  campaigns: CampaignResult[];
  currentCampaign: CampaignResult | null;
  leads: BusinessLead[];
  isLoading: boolean;
  error: string | null;
}

export interface UIStore {
  sidebarOpen: boolean;
  theme: "light" | "dark";
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: number;
}
