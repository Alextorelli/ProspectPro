export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      campaign_request_snapshots: {
        Row: {
          campaign_id: string | null;
          created_at: string | null;
          id: number;
          request_hash: string;
          request_payload: Json;
          session_user_id: string | null;
          user_id: string | null;
        };
        Insert: {
          campaign_id?: string | null;
          created_at?: string | null;
          id?: number;
          request_hash: string;
          request_payload: Json;
          session_user_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          campaign_id?: string | null;
          created_at?: string | null;
          id?: number;
          request_hash?: string;
          request_payload?: Json;
          session_user_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_request_snapshots_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaign_analytics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_request_snapshots_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaign_analytics_enhanced";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_request_snapshots_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          }
        ];
      };
      campaigns: {
        Row: {
          budget_alerts_enabled: boolean | null;
          budget_limit: number | null;
          business_type: string;
          campaign_hash: string | null;
          created_at: string | null;
          display_name: string | null;
          generated_name: string | null;
          id: string;
          location: string;
          min_confidence_score: number | null;
          name_components: Json | null;
          processing_time_ms: number | null;
          results_count: number | null;
          session_user_id: string | null;
          status: string | null;
          target_count: number | null;
          total_cost: number | null;
          updated_at: string | null;
          user_budget: number | null;
          user_id: string | null;
        };
        Insert: {
          budget_alerts_enabled?: boolean | null;
          budget_limit?: number | null;
          business_type: string;
          campaign_hash?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          generated_name?: string | null;
          id?: string;
          location: string;
          min_confidence_score?: number | null;
          name_components?: Json | null;
          processing_time_ms?: number | null;
          results_count?: number | null;
          session_user_id?: string | null;
          status?: string | null;
          target_count?: number | null;
          total_cost?: number | null;
          updated_at?: string | null;
          user_budget?: number | null;
          user_id?: string | null;
        };
        Update: {
          budget_alerts_enabled?: boolean | null;
          budget_limit?: number | null;
          business_type?: string;
          campaign_hash?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          generated_name?: string | null;
          id?: string;
          location?: string;
          min_confidence_score?: number | null;
          name_components?: Json | null;
          processing_time_ms?: number | null;
          results_count?: number | null;
          session_user_id?: string | null;
          status?: string | null;
          target_count?: number | null;
          total_cost?: number | null;
          updated_at?: string | null;
          user_budget?: number | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      dashboard_exports: {
        Row: {
          campaign_id: string | null;
          completed_at: string | null;
          created_at: string | null;
          export_status: string | null;
          export_type: string | null;
          file_format: string | null;
          id: number;
          row_count: number | null;
          session_user_id: string | null;
          user_id: string | null;
        };
        Insert: {
          campaign_id?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          export_status?: string | null;
          export_type?: string | null;
          file_format?: string | null;
          id?: number;
          row_count?: number | null;
          session_user_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          campaign_id?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          export_status?: string | null;
          export_type?: string | null;
          file_format?: string | null;
          id?: number;
          row_count?: number | null;
          session_user_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dashboard_exports_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaign_analytics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dashboard_exports_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaign_analytics_enhanced";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dashboard_exports_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          }
        ];
      };
      discovery_jobs: {
        Row: {
          campaign_id: string | null;
          completed_at: string | null;
          config: Json;
          created_at: string | null;
          current_stage: string | null;
          error: string | null;
          id: string;
          metrics: Json | null;
          progress: number | null;
          results: Json | null;
          session_user_id: string | null;
          started_at: string | null;
          status: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          campaign_id?: string | null;
          completed_at?: string | null;
          config: Json;
          created_at?: string | null;
          current_stage?: string | null;
          error?: string | null;
          id: string;
          metrics?: Json | null;
          progress?: number | null;
          results?: Json | null;
          session_user_id?: string | null;
          started_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          campaign_id?: string | null;
          completed_at?: string | null;
          config?: Json;
          created_at?: string | null;
          current_stage?: string | null;
          error?: string | null;
          id?: string;
          metrics?: Json | null;
          progress?: number | null;
          results?: Json | null;
          session_user_id?: string | null;
          started_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      enhanced_api_usage: {
        Row: {
          actual_cost: number | null;
          billing_category: string | null;
          business_query: string | null;
          cache_hit: boolean | null;
          campaign_id: string | null;
          cost_currency: string | null;
          created_at: string | null;
          data_quality_score: number | null;
          endpoint: string | null;
          error_message: string | null;
          estimated_cost: number | null;
          http_method: string | null;
          id: number;
          location_query: string | null;
          query_type: string | null;
          rate_limited: boolean | null;
          request_id: string;
          request_params: Json | null;
          response_code: number | null;
          response_time_ms: number | null;
          results_returned: number | null;
          retry_count: number | null;
          session_id: string | null;
          source_name: string;
          success: boolean | null;
          useful_results: number | null;
        };
        Insert: {
          actual_cost?: number | null;
          billing_category?: string | null;
          business_query?: string | null;
          cache_hit?: boolean | null;
          campaign_id?: string | null;
          cost_currency?: string | null;
          created_at?: string | null;
          data_quality_score?: number | null;
          endpoint?: string | null;
          error_message?: string | null;
          estimated_cost?: number | null;
          http_method?: string | null;
          id?: number;
          location_query?: string | null;
          query_type?: string | null;
          rate_limited?: boolean | null;
          request_id: string;
          request_params?: Json | null;
          response_code?: number | null;
          response_time_ms?: number | null;
          results_returned?: number | null;
          retry_count?: number | null;
          session_id?: string | null;
          source_name: string;
          success?: boolean | null;
          useful_results?: number | null;
        };
        Update: {
          actual_cost?: number | null;
          billing_category?: string | null;
          business_query?: string | null;
          cache_hit?: boolean | null;
          campaign_id?: string | null;
          cost_currency?: string | null;
          created_at?: string | null;
          data_quality_score?: number | null;
          endpoint?: string | null;
          error_message?: string | null;
          estimated_cost?: number | null;
          http_method?: string | null;
          id?: number;
          location_query?: string | null;
          query_type?: string | null;
          rate_limited?: boolean | null;
          request_id?: string;
          request_params?: Json | null;
          response_code?: number | null;
          response_time_ms?: number | null;
          results_returned?: number | null;
          retry_count?: number | null;
          session_id?: string | null;
          source_name?: string;
          success?: boolean | null;
          useful_results?: number | null;
        };
        Relationships: [];
      };
      enhanced_leads: {
        Row: {
          address: string | null;
          business_name: string;
          campaign_id: string | null;
          confidence_score: number | null;
          created_at: string | null;
          email: string | null;
          enrichment_data: Json | null;
          foursquare_data: Json | null;
          id: number;
          phone: string | null;
          score_breakdown: Json | null;
          session_user_id: string | null;
          updated_at: string | null;
          user_id: string | null;
          validation_cost: number | null;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          business_name: string;
          campaign_id?: string | null;
          confidence_score?: number | null;
          created_at?: string | null;
          email?: string | null;
          enrichment_data?: Json | null;
          foursquare_data?: Json | null;
          id?: number;
          phone?: string | null;
          score_breakdown?: Json | null;
          session_user_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          validation_cost?: number | null;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          business_name?: string;
          campaign_id?: string | null;
          confidence_score?: number | null;
          created_at?: string | null;
          email?: string | null;
          enrichment_data?: Json | null;
          foursquare_data?: Json | null;
          id?: number;
          phone?: string | null;
          score_breakdown?: Json | null;
          session_user_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          validation_cost?: number | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "enhanced_leads_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaign_analytics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enhanced_leads_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaign_analytics_enhanced";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enhanced_leads_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          }
        ];
      };
      enrichment_cache: {
        Row: {
          cache_key: string;
          confidence_score: number | null;
          cost: number | null;
          created_at: string | null;
          expires_at: string;
          hit_count: number | null;
          id: number;
          is_active: boolean | null;
          last_accessed_at: string | null;
          request_params: Json;
          request_type: string;
          response_data: Json;
          updated_at: string | null;
        };
        Insert: {
          cache_key: string;
          confidence_score?: number | null;
          cost?: number | null;
          created_at?: string | null;
          expires_at: string;
          hit_count?: number | null;
          id?: number;
          is_active?: boolean | null;
          last_accessed_at?: string | null;
          request_params: Json;
          request_type: string;
          response_data: Json;
          updated_at?: string | null;
        };
        Update: {
          cache_key?: string;
          confidence_score?: number | null;
          cost?: number | null;
          created_at?: string | null;
          expires_at?: string;
          hit_count?: number | null;
          id?: number;
          is_active?: boolean | null;
          last_accessed_at?: string | null;
          request_params?: Json;
          request_type?: string;
          response_data?: Json;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      enrichment_cache_stats: {
        Row: {
          cache_hits: number | null;
          cache_misses: number | null;
          cost_saved: number | null;
          created_at: string | null;
          date: string;
          hit_ratio: number | null;
          id: number;
          request_type: string;
          total_cost: number | null;
          total_requests: number | null;
          updated_at: string | null;
        };
        Insert: {
          cache_hits?: number | null;
          cache_misses?: number | null;
          cost_saved?: number | null;
          created_at?: string | null;
          date?: string;
          hit_ratio?: number | null;
          id?: number;
          request_type: string;
          total_cost?: number | null;
          total_requests?: number | null;
          updated_at?: string | null;
        };
        Update: {
          cache_hits?: number | null;
          cache_misses?: number | null;
          cost_saved?: number | null;
          created_at?: string | null;
          date?: string;
          hit_ratio?: number | null;
          id?: number;
          request_type?: string;
          total_cost?: number | null;
          total_requests?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      function_logs: {
        Row: {
          duration_ms: number | null;
          function_name: string;
          id: number;
          level: string;
          message: string;
          metadata: Json | null;
          request_id: string | null;
          ts: string | null;
          user_id: string | null;
        };
        Insert: {
          duration_ms?: number | null;
          function_name: string;
          id?: number;
          level: string;
          message: string;
          metadata?: Json | null;
          request_id?: string | null;
          ts?: string | null;
          user_id?: string | null;
        };
        Update: {
          duration_ms?: number | null;
          function_name?: string;
          id?: number;
          level?: string;
          message?: string;
          metadata?: Json | null;
          request_id?: string | null;
          ts?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      lead_fingerprints: {
        Row: {
          business_name: string | null;
          campaign_id: string | null;
          created_at: string | null;
          fingerprint: string;
          id: number;
          lead_id: number | null;
          session_user_id: string | null;
          user_id: string | null;
        };
        Insert: {
          business_name?: string | null;
          campaign_id?: string | null;
          created_at?: string | null;
          fingerprint: string;
          id?: number;
          lead_id?: number | null;
          session_user_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          business_name?: string | null;
          campaign_id?: string | null;
          created_at?: string | null;
          fingerprint?: string;
          id?: number;
          lead_id?: number | null;
          session_user_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_fingerprints_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaign_analytics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_fingerprints_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaign_analytics_enhanced";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_fingerprints_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_fingerprints_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          }
        ];
      };
      leads: {
        Row: {
          address: string | null;
          business_name: string;
          campaign_id: string | null;
          confidence_score: number | null;
          cost_efficient: boolean | null;
          created_at: string | null;
          email: string | null;
          enrichment_data: Json | null;
          id: number;
          phone: string | null;
          score_breakdown: Json | null;
          scoring_recommendation: string | null;
          session_user_id: string | null;
          updated_at: string | null;
          user_id: string | null;
          validation_cost: number | null;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          business_name: string;
          campaign_id?: string | null;
          confidence_score?: number | null;
          cost_efficient?: boolean | null;
          created_at?: string | null;
          email?: string | null;
          enrichment_data?: Json | null;
          id?: number;
          phone?: string | null;
          score_breakdown?: Json | null;
          scoring_recommendation?: string | null;
          session_user_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          validation_cost?: number | null;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          business_name?: string;
          campaign_id?: string | null;
          confidence_score?: number | null;
          cost_efficient?: boolean | null;
          created_at?: string | null;
          email?: string | null;
          enrichment_data?: Json | null;
          id?: number;
          phone?: string | null;
          score_breakdown?: Json | null;
          scoring_recommendation?: string | null;
          session_user_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          validation_cost?: number | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaign_analytics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaign_analytics_enhanced";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          }
        ];
      };
      payment_methods: {
        Row: {
          brand: string | null;
          created_at: string | null;
          exp_month: number | null;
          exp_year: number | null;
          id: number;
          is_default: boolean | null;
          last_four: string | null;
          stripe_payment_method_id: string;
          type: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          brand?: string | null;
          created_at?: string | null;
          exp_month?: number | null;
          exp_year?: number | null;
          id?: number;
          is_default?: boolean | null;
          last_four?: string | null;
          stripe_payment_method_id: string;
          type: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          brand?: string | null;
          created_at?: string | null;
          exp_month?: number | null;
          exp_year?: number | null;
          id?: number;
          is_default?: boolean | null;
          last_four?: string | null;
          stripe_payment_method_id?: string;
          type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      payment_transactions: {
        Row: {
          amount: number;
          campaign_id: string | null;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          id: number;
          status: string;
          stripe_payment_intent_id: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          campaign_id?: string | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          id?: number;
          status: string;
          stripe_payment_intent_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          campaign_id?: string | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          id?: number;
          status?: string;
          stripe_payment_intent_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payment_transactions_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaign_analytics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_transactions_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaign_analytics_enhanced";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_transactions_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          }
        ];
      };
      subscription_tiers: {
        Row: {
          created_at: string | null;
          features: Json | null;
          id: number;
          is_active: boolean | null;
          max_exports: number | null;
          max_searches: number | null;
          name: string;
          price_monthly: number;
          price_yearly: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          features?: Json | null;
          id?: number;
          is_active?: boolean | null;
          max_exports?: number | null;
          max_searches?: number | null;
          name: string;
          price_monthly?: number;
          price_yearly?: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          features?: Json | null;
          id?: number;
          is_active?: boolean | null;
          max_exports?: number | null;
          max_searches?: number | null;
          name?: string;
          price_monthly?: number;
          price_yearly?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      usage_logs: {
        Row: {
          action_type: string;
          campaign_id: string | null;
          cost: number | null;
          id: string;
          timestamp: string | null;
          user_id: string | null;
        };
        Insert: {
          action_type: string;
          campaign_id?: string | null;
          cost?: number | null;
          id?: string;
          timestamp?: string | null;
          user_id?: string | null;
        };
        Update: {
          action_type?: string;
          campaign_id?: string | null;
          cost?: number | null;
          id?: string;
          timestamp?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_campaign_results: {
        Row: {
          business_address: string | null;
          business_identifier: string;
          business_name: string | null;
          campaign_hash: string;
          campaign_id: string | null;
          created_at: string | null;
          id: number;
          served_at: string | null;
          session_user_id: string | null;
          user_id: string | null;
        };
        Insert: {
          business_address?: string | null;
          business_identifier: string;
          business_name?: string | null;
          campaign_hash: string;
          campaign_id?: string | null;
          created_at?: string | null;
          id?: number;
          served_at?: string | null;
          session_user_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          business_address?: string | null;
          business_identifier?: string;
          business_name?: string | null;
          campaign_hash?: string;
          campaign_id?: string | null;
          created_at?: string | null;
          id?: number;
          served_at?: string | null;
          session_user_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_campaign_results_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaign_analytics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_campaign_results_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaign_analytics_enhanced";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_campaign_results_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          }
        ];
      };
      user_profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          monthly_budget: number | null;
          subscription_tier: string | null;
          total_spent: number | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          monthly_budget?: number | null;
          subscription_tier?: string | null;
          total_spent?: number | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          monthly_budget?: number | null;
          subscription_tier?: string | null;
          total_spent?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          exports_used: number | null;
          id: string;
          searches_used: number | null;
          status: string | null;
          stripe_subscription_id: string | null;
          tier_id: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          exports_used?: number | null;
          id?: string;
          searches_used?: number | null;
          status?: string | null;
          stripe_subscription_id?: string | null;
          tier_id?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          exports_used?: number | null;
          id?: string;
          searches_used?: number | null;
          status?: string | null;
          stripe_subscription_id?: string | null;
          tier_id?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_tier_id_fkey";
            columns: ["tier_id"];
            isOneToOne: false;
            referencedRelation: "subscription_tiers";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      cache_performance_summary: {
        Row: {
          daily_cost_saved: number | null;
          daily_hit_ratio: number | null;
          daily_hits: number | null;
          daily_misses: number | null;
          daily_requests: number | null;
          daily_total_cost: number | null;
          date: string | null;
        };
        Relationships: [];
      };
      campaign_analytics: {
        Row: {
          actual_leads: number | null;
          avg_confidence: number | null;
          budget_limit: number | null;
          business_type: string | null;
          created_at: string | null;
          id: string | null;
          location: string | null;
          min_confidence_score: number | null;
          processing_time_ms: number | null;
          results_count: number | null;
          session_user_id: string | null;
          status: string | null;
          target_count: number | null;
          total_cost: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      campaign_analytics_enhanced: {
        Row: {
          actual_leads: number | null;
          avg_confidence: number | null;
          budget_limit: number | null;
          business_type: string | null;
          created_at: string | null;
          display_name: string | null;
          generated_name: string | null;
          id: string | null;
          location: string | null;
          min_confidence_score: number | null;
          processing_time_ms: number | null;
          results_count: number | null;
          session_user_id: string | null;
          status: string | null;
          target_count: number | null;
          total_cost: number | null;
          user_budget: number | null;
          user_email: string | null;
          user_id: string | null;
          user_name: string | null;
          within_budget: boolean | null;
        };
        Relationships: [];
      };
      enrichment_cache_analytics: {
        Row: {
          active_entries: number | null;
          avg_confidence: number | null;
          avg_hit_count: number | null;
          expired_entries: number | null;
          last_activity: string | null;
          oldest_entry: string | null;
          request_type: string | null;
          total_cost_saved: number | null;
          total_entries: number | null;
          total_hits: number | null;
        };
        Relationships: [];
      };
      pg_all_foreign_keys: {
        Row: {
          fk_columns: unknown[] | null;
          fk_constraint_name: unknown | null;
          fk_schema_name: unknown | null;
          fk_table_name: unknown | null;
          fk_table_oid: unknown | null;
          is_deferrable: boolean | null;
          is_deferred: boolean | null;
          match_type: string | null;
          on_delete: string | null;
          on_update: string | null;
          pk_columns: unknown[] | null;
          pk_constraint_name: unknown | null;
          pk_index_name: unknown | null;
          pk_schema_name: unknown | null;
          pk_table_name: unknown | null;
          pk_table_oid: unknown | null;
        };
        Relationships: [];
      };
      tap_funky: {
        Row: {
          args: string | null;
          is_definer: boolean | null;
          is_strict: boolean | null;
          is_visible: boolean | null;
          kind: unknown | null;
          langoid: unknown | null;
          name: unknown | null;
          oid: unknown | null;
          owner: unknown | null;
          returns: string | null;
          returns_set: boolean | null;
          schema: unknown | null;
          volatility: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      _cleanup: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      _contract_on: {
        Args: { "": string };
        Returns: unknown;
      };
      _currtest: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      _db_privs: {
        Args: Record<PropertyKey, never>;
        Returns: unknown[];
      };
      _definer: {
        Args: { "": unknown };
        Returns: boolean;
      };
      _dexists: {
        Args: { "": unknown };
        Returns: boolean;
      };
      _expand_context: {
        Args: { "": string };
        Returns: string;
      };
      _expand_on: {
        Args: { "": string };
        Returns: string;
      };
      _expand_vol: {
        Args: { "": string };
        Returns: string;
      };
      _ext_exists: {
        Args: { "": unknown };
        Returns: boolean;
      };
      _extensions: {
        Args: Record<PropertyKey, never> | { "": unknown };
        Returns: unknown[];
      };
      _funkargs: {
        Args: { "": unknown[] };
        Returns: string;
      };
      _get: {
        Args: { "": string };
        Returns: number;
      };
      _get_db_owner: {
        Args: { "": unknown };
        Returns: unknown;
      };
      _get_dtype: {
        Args: { "": unknown };
        Returns: string;
      };
      _get_language_owner: {
        Args: { "": unknown };
        Returns: unknown;
      };
      _get_latest: {
        Args: { "": string };
        Returns: number[];
      };
      _get_note: {
        Args: { "": number } | { "": string };
        Returns: string;
      };
      _get_opclass_owner: {
        Args: { "": unknown };
        Returns: unknown;
      };
      _get_rel_owner: {
        Args: { "": unknown };
        Returns: unknown;
      };
      _get_schema_owner: {
        Args: { "": unknown };
        Returns: unknown;
      };
      _get_tablespace_owner: {
        Args: { "": unknown };
        Returns: unknown;
      };
      _get_type_owner: {
        Args: { "": unknown };
        Returns: unknown;
      };
      _got_func: {
        Args: { "": unknown };
        Returns: boolean;
      };
      _grolist: {
        Args: { "": unknown };
        Returns: unknown[];
      };
      _has_group: {
        Args: { "": unknown };
        Returns: boolean;
      };
      _has_role: {
        Args: { "": unknown };
        Returns: boolean;
      };
      _has_user: {
        Args: { "": unknown };
        Returns: boolean;
      };
      _inherited: {
        Args: { "": unknown };
        Returns: boolean;
      };
      _is_schema: {
        Args: { "": unknown };
        Returns: boolean;
      };
      _is_super: {
        Args: { "": unknown };
        Returns: boolean;
      };
      _is_trusted: {
        Args: { "": unknown };
        Returns: boolean;
      };
      _is_verbose: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      _lang: {
        Args: { "": unknown };
        Returns: unknown;
      };
      _opc_exists: {
        Args: { "": unknown };
        Returns: boolean;
      };
      _parts: {
        Args: { "": unknown };
        Returns: unknown[];
      };
      _pg_sv_type_array: {
        Args: { "": unknown[] };
        Returns: unknown[];
      };
      _prokind: {
        Args: { p_oid: unknown };
        Returns: unknown;
      };
      _query: {
        Args: { "": string };
        Returns: string;
      };
      _refine_vol: {
        Args: { "": string };
        Returns: string;
      };
      _relexists: {
        Args: { "": unknown };
        Returns: boolean;
      };
      _returns: {
        Args: { "": unknown };
        Returns: string;
      };
      _strict: {
        Args: { "": unknown };
        Returns: boolean;
      };
      _table_privs: {
        Args: Record<PropertyKey, never>;
        Returns: unknown[];
      };
      _temptypes: {
        Args: { "": string };
        Returns: string;
      };
      _todo: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      _vol: {
        Args: { "": unknown };
        Returns: string;
      };
      can: {
        Args: { "": unknown[] };
        Returns: string;
      };
      casts_are: {
        Args: { "": string[] };
        Returns: string;
      };
      check_usage_limit: {
        Args: { action_type: string; user_uuid: string };
        Returns: Json;
      };
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      cleanup_old_deduplication_records: {
        Args: { days_to_keep?: number };
        Returns: number;
      };
      cleanup_old_jobs: {
        Args: { retention_days?: number };
        Returns: number;
      };
      col_is_null: {
        Args:
          | {
              column_name: unknown;
              description?: string;
              schema_name: unknown;
              table_name: unknown;
            }
          | { column_name: unknown; description?: string; table_name: unknown };
        Returns: string;
      };
      col_not_null: {
        Args:
          | {
              column_name: unknown;
              description?: string;
              schema_name: unknown;
              table_name: unknown;
            }
          | { column_name: unknown; description?: string; table_name: unknown };
        Returns: string;
      };
      collect_tap: {
        Args: { "": string[] } | { "": string[] };
        Returns: string;
      };
      current_session_identifier: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      diag: {
        Args:
          | { "": string[] }
          | { "": unknown }
          | { msg: string }
          | { msg: unknown };
        Returns: string;
      };
      diag_test_name: {
        Args: { "": string };
        Returns: string;
      };
      do_tap: {
        Args: Record<PropertyKey, never> | { "": string } | { "": unknown };
        Returns: string[];
      };
      domains_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      enums_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      extensions_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      fail: {
        Args: Record<PropertyKey, never> | { "": string };
        Returns: string;
      };
      filter_already_served_businesses: {
        Args: {
          p_business_identifiers: string[];
          p_campaign_hash: string;
          p_session_user_id: string;
          p_user_id: string;
        };
        Returns: string[];
      };
      findfuncs: {
        Args: { "": string };
        Returns: string[];
      };
      finish: {
        Args: { exception_on_failure?: boolean };
        Returns: string[];
      };
      foreign_tables_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      functions_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      generate_business_identifier: {
        Args: { business_address: string; business_name: string };
        Returns: string;
      };
      generate_cache_key: {
        Args: { p_params: Json; p_request_type: string };
        Returns: string;
      };
      generate_campaign_hash: {
        Args: {
          business_type: string;
          location: string;
          min_confidence_score?: number;
        };
        Returns: string;
      };
      generate_campaign_name: {
        Args: { business_type: string; location: string; user_id?: string };
        Returns: string;
      };
      get_cached_response: {
        Args: { p_params: Json; p_request_type: string };
        Returns: Json;
      };
      get_function_summary: {
        Args: { p_function: string; p_hours?: number };
        Returns: Json;
      };
      get_user_campaigns: {
        Args: { target_session_user_id?: string; target_user_id?: string };
        Returns: {
          business_type: string;
          created_at: string;
          id: string;
          location: string;
          results_count: number;
          status: string;
          target_count: number;
          total_cost: number;
        }[];
      };
      get_user_usage_stats: {
        Args: { target_session_user_id?: string; target_user_id?: string };
        Returns: Json;
      };
      groups_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      has_check: {
        Args: { "": unknown };
        Returns: string;
      };
      has_composite: {
        Args: { "": unknown };
        Returns: string;
      };
      has_domain: {
        Args: { "": unknown };
        Returns: string;
      };
      has_enum: {
        Args: { "": unknown };
        Returns: string;
      };
      has_extension: {
        Args: { "": unknown };
        Returns: string;
      };
      has_fk: {
        Args: { "": unknown };
        Returns: string;
      };
      has_foreign_table: {
        Args: { "": unknown };
        Returns: string;
      };
      has_function: {
        Args: { "": unknown };
        Returns: string;
      };
      has_group: {
        Args: { "": unknown };
        Returns: string;
      };
      has_inherited_tables: {
        Args: { "": unknown };
        Returns: string;
      };
      has_language: {
        Args: { "": unknown };
        Returns: string;
      };
      has_materialized_view: {
        Args: { "": unknown };
        Returns: string;
      };
      has_opclass: {
        Args: { "": unknown };
        Returns: string;
      };
      has_pk: {
        Args: { "": unknown };
        Returns: string;
      };
      has_relation: {
        Args: { "": unknown };
        Returns: string;
      };
      has_role: {
        Args: { "": unknown };
        Returns: string;
      };
      has_schema: {
        Args: { "": unknown };
        Returns: string;
      };
      has_sequence: {
        Args: { "": unknown };
        Returns: string;
      };
      has_table: {
        Args: { "": unknown };
        Returns: string;
      };
      has_tablespace: {
        Args: { "": unknown };
        Returns: string;
      };
      has_type: {
        Args: { "": unknown };
        Returns: string;
      };
      has_unique: {
        Args: { "": string };
        Returns: string;
      };
      has_user: {
        Args: { "": unknown };
        Returns: string;
      };
      has_view: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_composite: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_domain: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_enum: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_extension: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_fk: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_foreign_table: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_function: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_group: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_inherited_tables: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_language: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_materialized_view: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_opclass: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_pk: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_relation: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_role: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_schema: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_sequence: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_table: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_tablespace: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_type: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_user: {
        Args: { "": unknown };
        Returns: string;
      };
      hasnt_view: {
        Args: { "": unknown };
        Returns: string;
      };
      in_todo: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      increment_usage: {
        Args: {
          action_type: string;
          campaign_id_param?: string;
          cost_param?: number;
          user_uuid: string;
        };
        Returns: boolean;
      };
      index_is_primary: {
        Args: { "": unknown };
        Returns: string;
      };
      index_is_unique: {
        Args: { "": unknown };
        Returns: string;
      };
      is_aggregate: {
        Args: { "": unknown };
        Returns: string;
      };
      is_clustered: {
        Args: { "": unknown };
        Returns: string;
      };
      is_definer: {
        Args: { "": unknown };
        Returns: string;
      };
      is_empty: {
        Args: { "": string };
        Returns: string;
      };
      is_normal_function: {
        Args: { "": unknown };
        Returns: string;
      };
      is_partitioned: {
        Args: { "": unknown };
        Returns: string;
      };
      is_procedure: {
        Args: { "": unknown };
        Returns: string;
      };
      is_strict: {
        Args: { "": unknown };
        Returns: string;
      };
      is_superuser: {
        Args: { "": unknown };
        Returns: string;
      };
      is_window: {
        Args: { "": unknown };
        Returns: string;
      };
      isnt_aggregate: {
        Args: { "": unknown };
        Returns: string;
      };
      isnt_definer: {
        Args: { "": unknown };
        Returns: string;
      };
      isnt_empty: {
        Args: { "": string };
        Returns: string;
      };
      isnt_normal_function: {
        Args: { "": unknown };
        Returns: string;
      };
      isnt_partitioned: {
        Args: { "": unknown };
        Returns: string;
      };
      isnt_procedure: {
        Args: { "": unknown };
        Returns: string;
      };
      isnt_strict: {
        Args: { "": unknown };
        Returns: string;
      };
      isnt_superuser: {
        Args: { "": unknown };
        Returns: string;
      };
      isnt_window: {
        Args: { "": unknown };
        Returns: string;
      };
      language_is_trusted: {
        Args: { "": unknown };
        Returns: string;
      };
      languages_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      link_anonymous_campaigns_to_user: {
        Args: { authenticated_user_id: string; target_session_user_id: string };
        Returns: number;
      };
      lives_ok: {
        Args: { "": string };
        Returns: string;
      };
      materialized_views_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      no_plan: {
        Args: Record<PropertyKey, never>;
        Returns: boolean[];
      };
      num_failed: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      ok: {
        Args: { "": boolean };
        Returns: string;
      };
      opclasses_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      operators_are: {
        Args: { "": string[] };
        Returns: string;
      };
      os_name: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      pass: {
        Args: Record<PropertyKey, never> | { "": string };
        Returns: string;
      };
      pg_version: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      pg_version_num: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      pgtap_version: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      plan: {
        Args: { "": number };
        Returns: string;
      };
      record_served_businesses: {
        Args: {
          p_businesses: Json;
          p_campaign_hash: string;
          p_campaign_id: string;
          p_session_user_id: string;
          p_user_id: string;
        };
        Returns: number;
      };
      roles_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      runtests: {
        Args: Record<PropertyKey, never> | { "": string } | { "": unknown };
        Returns: string[];
      };
      schemas_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      sequences_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      skip: {
        Args:
          | { "": number }
          | { "": string }
          | { how_many: number; why: string };
        Returns: string;
      };
      store_cached_response: {
        Args:
          | {
              p_confidence_score?: number;
              p_cost?: number;
              p_params: Json;
              p_request_type: string;
              p_response: Json;
            }
          | {
              p_confidence_score?: number;
              p_cost?: number;
              p_params: Json;
              p_request_type: string;
              p_response: Json;
              p_ttl?: unknown;
            };
        Returns: string;
      };
      tables_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      tablespaces_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      throws_ok: {
        Args: { "": string };
        Returns: string;
      };
      todo: {
        Args:
          | { how_many: number }
          | { how_many: number; why: string }
          | { how_many: number; why: string }
          | { why: string };
        Returns: boolean[];
      };
      todo_end: {
        Args: Record<PropertyKey, never>;
        Returns: boolean[];
      };
      todo_start: {
        Args: Record<PropertyKey, never> | { "": string };
        Returns: boolean[];
      };
      types_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      update_user_spending: {
        Args: { amount_param: number; user_id_param: string };
        Returns: undefined;
      };
      users_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
      validate_api_key_format: {
        Args: { api_key: string };
        Returns: boolean;
      };
      validate_security_configuration: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      views_are: {
        Args: { "": unknown[] };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      _time_trial_type: {
        a_time: number | null;
      };
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
