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
  processing_time: number;
  campaign_id: string;
  qualified_count: number;
  total_found: number;
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
