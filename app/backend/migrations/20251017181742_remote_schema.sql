create sequence "public"."campaign_request_snapshots_id_seq";

create sequence "public"."dashboard_exports_id_seq";

create sequence "public"."enhanced_api_usage_id_seq";

create sequence "public"."enhanced_leads_id_seq";

create sequence "public"."enrichment_cache_id_seq";

create sequence "public"."enrichment_cache_stats_id_seq";

create sequence "public"."function_logs_id_seq";

create sequence "public"."lead_fingerprints_id_seq";

create sequence "public"."leads_id_seq";

create sequence "public"."payment_methods_id_seq";

create sequence "public"."payment_transactions_id_seq";

create sequence "public"."subscription_tiers_id_seq";

create sequence "public"."user_campaign_results_id_seq";

create table "public"."campaign_request_snapshots" (
    "id" bigint not null default nextval('campaign_request_snapshots_id_seq'::regclass),
    "campaign_id" text,
    "user_id" uuid,
    "session_user_id" text,
    "request_hash" text not null,
    "request_payload" jsonb not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."campaign_request_snapshots" enable row level security;

create table "public"."campaigns" (
    "id" text not null default (gen_random_uuid())::text,
    "business_type" text not null,
    "location" text not null,
    "target_count" integer default 10,
    "budget_limit" numeric(10,4) default 50.0,
    "min_confidence_score" integer default 50,
    "status" text default 'pending'::text,
    "results_count" integer default 0,
    "total_cost" numeric(10,4) default 0,
    "processing_time_ms" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "user_id" uuid,
    "session_user_id" text,
    "generated_name" character varying(100),
    "display_name" character varying(200),
    "name_components" jsonb,
    "user_budget" numeric(10,4) default 50.0,
    "budget_alerts_enabled" boolean default true,
    "campaign_hash" text
);


alter table "public"."campaigns" enable row level security;

create table "public"."dashboard_exports" (
    "id" bigint not null default nextval('dashboard_exports_id_seq'::regclass),
    "campaign_id" text,
    "export_type" text default 'lead_export'::text,
    "file_format" text default 'csv'::text,
    "row_count" integer default 0,
    "export_status" text default 'completed'::text,
    "completed_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "user_id" uuid,
    "session_user_id" text
);


alter table "public"."dashboard_exports" enable row level security;

create table "public"."discovery_jobs" (
    "id" text not null,
    "campaign_id" text,
    "user_id" uuid,
    "session_user_id" text,
    "status" text default 'pending'::text,
    "progress" integer default 0,
    "current_stage" text default 'initializing'::text,
    "config" jsonb not null,
    "results" jsonb default '[]'::jsonb,
    "metrics" jsonb default '{}'::jsonb,
    "error" text,
    "created_at" timestamp with time zone default now(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone default now()
);


alter table "public"."discovery_jobs" enable row level security;

create table "public"."enhanced_api_usage" (
    "id" bigint not null default nextval('enhanced_api_usage_id_seq'::regclass),
    "created_at" timestamp with time zone default now(),
    "campaign_id" uuid,
    "session_id" text,
    "request_id" uuid not null,
    "source_name" text not null,
    "endpoint" text,
    "http_method" text default 'GET'::text,
    "request_params" jsonb,
    "query_type" text,
    "business_query" text,
    "location_query" text,
    "response_code" integer,
    "response_time_ms" integer,
    "results_returned" integer,
    "success" boolean,
    "error_message" text,
    "estimated_cost" numeric(12,4),
    "actual_cost" numeric(12,4),
    "cost_currency" text default 'USD'::text,
    "billing_category" text,
    "data_quality_score" numeric(6,2),
    "useful_results" integer,
    "cache_hit" boolean default false,
    "rate_limited" boolean default false,
    "retry_count" integer default 0
);


alter table "public"."enhanced_api_usage" enable row level security;

create table "public"."enhanced_leads" (
    "id" bigint not null default nextval('enhanced_leads_id_seq'::regclass),
    "campaign_id" text,
    "business_name" text not null,
    "address" text,
    "phone" text,
    "website" text,
    "email" text,
    "confidence_score" integer default 0,
    "score_breakdown" jsonb,
    "validation_cost" numeric(10,4) default 0,
    "enrichment_data" jsonb,
    "foursquare_data" jsonb,
    "user_id" uuid,
    "session_user_id" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."enhanced_leads" enable row level security;

create table "public"."enrichment_cache" (
    "id" bigint not null default nextval('enrichment_cache_id_seq'::regclass),
    "cache_key" text not null,
    "request_type" text not null,
    "request_params" jsonb not null,
    "response_data" jsonb not null,
    "cost" numeric(10,4) default 0,
    "confidence_score" integer default 0,
    "hit_count" integer default 1,
    "expires_at" timestamp with time zone not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "last_accessed_at" timestamp with time zone default now(),
    "is_active" boolean default true
);


alter table "public"."enrichment_cache" enable row level security;

create table "public"."enrichment_cache_stats" (
    "id" bigint not null default nextval('enrichment_cache_stats_id_seq'::regclass),
    "date" date not null default CURRENT_DATE,
    "request_type" text not null,
    "total_requests" integer default 0,
    "cache_hits" integer default 0,
    "cache_misses" integer default 0,
    "cost_saved" numeric(10,4) default 0,
    "total_cost" numeric(10,4) default 0,
    "hit_ratio" numeric(5,2) default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."enrichment_cache_stats" enable row level security;

create table "public"."function_logs" (
    "id" bigint not null default nextval('function_logs_id_seq'::regclass),
    "ts" timestamp with time zone default now(),
    "function_name" text not null,
    "level" text not null,
    "message" text not null,
    "duration_ms" integer,
    "user_id" uuid,
    "request_id" text,
    "metadata" jsonb
);


alter table "public"."function_logs" enable row level security;

create table "public"."lead_fingerprints" (
    "id" bigint not null default nextval('lead_fingerprints_id_seq'::regclass),
    "fingerprint" text not null,
    "user_id" uuid,
    "session_user_id" text,
    "campaign_id" text,
    "lead_id" bigint,
    "business_name" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."lead_fingerprints" enable row level security;

create table "public"."leads" (
    "id" bigint not null default nextval('leads_id_seq'::regclass),
    "campaign_id" text,
    "business_name" text not null,
    "address" text,
    "phone" text,
    "website" text,
    "email" text,
    "confidence_score" integer default 0,
    "score_breakdown" jsonb,
    "validation_cost" numeric(10,4) default 0,
    "enrichment_data" jsonb,
    "cost_efficient" boolean default true,
    "scoring_recommendation" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "user_id" uuid,
    "session_user_id" text
);


alter table "public"."leads" enable row level security;

create table "public"."payment_methods" (
    "id" bigint not null default nextval('payment_methods_id_seq'::regclass),
    "user_id" uuid,
    "stripe_payment_method_id" text not null,
    "type" text not null,
    "last_four" text,
    "brand" text,
    "exp_month" integer,
    "exp_year" integer,
    "is_default" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."payment_methods" enable row level security;

create table "public"."payment_transactions" (
    "id" bigint not null default nextval('payment_transactions_id_seq'::regclass),
    "user_id" uuid,
    "campaign_id" text,
    "stripe_payment_intent_id" text,
    "amount" numeric(10,4) not null,
    "currency" text default 'usd'::text,
    "status" text not null,
    "description" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."payment_transactions" enable row level security;

create table "public"."subscription_tiers" (
    "id" integer not null default nextval('subscription_tiers_id_seq'::regclass),
    "name" character varying(50) not null,
    "price_monthly" numeric(10,2) not null default 0.00,
    "price_yearly" numeric(10,2) not null default 0.00,
    "max_searches" integer default 10,
    "max_exports" integer default 2,
    "features" jsonb default '{}'::jsonb,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."subscription_tiers" enable row level security;

create table "public"."usage_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "action_type" character varying(20) not null,
    "campaign_id" text,
    "cost" numeric(10,4) default 0,
    "timestamp" timestamp with time zone default now()
);


alter table "public"."usage_logs" enable row level security;

create table "public"."user_campaign_results" (
    "id" bigint not null default nextval('user_campaign_results_id_seq'::regclass),
    "user_id" uuid,
    "session_user_id" text,
    "campaign_hash" text not null,
    "business_identifier" text not null,
    "served_at" timestamp with time zone default now(),
    "campaign_id" text,
    "business_name" text,
    "business_address" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."user_campaign_results" enable row level security;

create table "public"."user_profiles" (
    "id" uuid not null,
    "email" text,
    "full_name" text,
    "avatar_url" text,
    "subscription_tier" text default 'free'::text,
    "total_spent" numeric(10,4) default 0,
    "monthly_budget" numeric(10,4) default 100.0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_profiles" enable row level security;

create table "public"."user_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "tier_id" integer,
    "status" character varying(20) default 'active'::character varying,
    "current_period_start" timestamp with time zone default now(),
    "current_period_end" timestamp with time zone default (now() + '30 days'::interval),
    "searches_used" integer default 0,
    "exports_used" integer default 0,
    "stripe_subscription_id" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_subscriptions" enable row level security;

alter sequence "public"."campaign_request_snapshots_id_seq" owned by "public"."campaign_request_snapshots"."id";

alter sequence "public"."dashboard_exports_id_seq" owned by "public"."dashboard_exports"."id";

alter sequence "public"."enhanced_api_usage_id_seq" owned by "public"."enhanced_api_usage"."id";

alter sequence "public"."enhanced_leads_id_seq" owned by "public"."enhanced_leads"."id";

alter sequence "public"."enrichment_cache_id_seq" owned by "public"."enrichment_cache"."id";

alter sequence "public"."enrichment_cache_stats_id_seq" owned by "public"."enrichment_cache_stats"."id";

alter sequence "public"."function_logs_id_seq" owned by "public"."function_logs"."id";

alter sequence "public"."lead_fingerprints_id_seq" owned by "public"."lead_fingerprints"."id";

alter sequence "public"."leads_id_seq" owned by "public"."leads"."id";

alter sequence "public"."payment_methods_id_seq" owned by "public"."payment_methods"."id";

alter sequence "public"."payment_transactions_id_seq" owned by "public"."payment_transactions"."id";

alter sequence "public"."subscription_tiers_id_seq" owned by "public"."subscription_tiers"."id";

alter sequence "public"."user_campaign_results_id_seq" owned by "public"."user_campaign_results"."id";

CREATE UNIQUE INDEX campaign_request_snapshots_pkey ON public.campaign_request_snapshots USING btree (id);

CREATE UNIQUE INDEX campaigns_pkey ON public.campaigns USING btree (id);

CREATE UNIQUE INDEX dashboard_exports_pkey ON public.dashboard_exports USING btree (id);

CREATE UNIQUE INDEX discovery_jobs_pkey ON public.discovery_jobs USING btree (id);

CREATE UNIQUE INDEX enhanced_api_usage_pkey ON public.enhanced_api_usage USING btree (id);

CREATE UNIQUE INDEX enhanced_leads_pkey ON public.enhanced_leads USING btree (id);

CREATE UNIQUE INDEX enrichment_cache_cache_key_key ON public.enrichment_cache USING btree (cache_key);

CREATE UNIQUE INDEX enrichment_cache_pkey ON public.enrichment_cache USING btree (id);

CREATE UNIQUE INDEX enrichment_cache_stats_date_request_type_key ON public.enrichment_cache_stats USING btree (date, request_type);

CREATE UNIQUE INDEX enrichment_cache_stats_pkey ON public.enrichment_cache_stats USING btree (id);

CREATE UNIQUE INDEX function_logs_pkey ON public.function_logs USING btree (id);

CREATE INDEX idx_cache_stats_date ON public.enrichment_cache_stats USING btree (date);

CREATE INDEX idx_cache_stats_type ON public.enrichment_cache_stats USING btree (request_type);

CREATE UNIQUE INDEX idx_campaign_request_hash_unique ON public.campaign_request_snapshots USING btree (request_hash, user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_campaign_request_snapshots_campaign ON public.campaign_request_snapshots USING btree (campaign_id);

CREATE INDEX idx_campaign_request_snapshots_user_id ON public.campaign_request_snapshots USING btree (user_id);

CREATE INDEX idx_campaigns_campaign_hash ON public.campaigns USING btree (campaign_hash) WHERE (campaign_hash IS NOT NULL);

CREATE INDEX idx_campaigns_created_at ON public.campaigns USING btree (created_at DESC);

CREATE INDEX idx_campaigns_generated_name ON public.campaigns USING btree (generated_name);

CREATE INDEX idx_campaigns_session_user_id ON public.campaigns USING btree (session_user_id);

CREATE INDEX idx_campaigns_status ON public.campaigns USING btree (status);

CREATE INDEX idx_campaigns_user_budget ON public.campaigns USING btree (user_budget);

CREATE INDEX idx_campaigns_user_id ON public.campaigns USING btree (user_id);

CREATE INDEX idx_campaigns_user_session ON public.campaigns USING btree (user_id, session_user_id);

CREATE INDEX idx_dashboard_exports_campaign_id ON public.dashboard_exports USING btree (campaign_id);

CREATE INDEX idx_dashboard_exports_user_id ON public.dashboard_exports USING btree (user_id);

CREATE INDEX idx_enhanced_api_usage_campaign_id ON public.enhanced_api_usage USING btree (campaign_id);

CREATE INDEX idx_enhanced_api_usage_created_at ON public.enhanced_api_usage USING btree (created_at DESC);

CREATE INDEX idx_enhanced_api_usage_source_name ON public.enhanced_api_usage USING btree (source_name);

CREATE INDEX idx_enhanced_api_usage_success ON public.enhanced_api_usage USING btree (success);

CREATE INDEX idx_enrichment_cache_active ON public.enrichment_cache USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_enrichment_cache_created ON public.enrichment_cache USING btree (created_at);

CREATE INDEX idx_enrichment_cache_expires_at ON public.enrichment_cache USING btree (expires_at);

CREATE INDEX idx_enrichment_cache_key ON public.enrichment_cache USING btree (cache_key);

CREATE INDEX idx_enrichment_cache_lookup ON public.enrichment_cache USING btree (request_type, cache_key);

CREATE INDEX idx_enrichment_cache_request_type ON public.enrichment_cache USING btree (request_type);

CREATE INDEX idx_exports_user_session ON public.dashboard_exports USING btree (user_id, session_user_id);

CREATE INDEX idx_function_logs_function_ts ON public.function_logs USING btree (function_name, ts DESC);

CREATE INDEX idx_jobs_campaign ON public.discovery_jobs USING btree (campaign_id);

CREATE INDEX idx_jobs_created ON public.discovery_jobs USING btree (created_at DESC);

CREATE INDEX idx_jobs_session ON public.discovery_jobs USING btree (session_user_id);

CREATE INDEX idx_jobs_status ON public.discovery_jobs USING btree (status) WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text]));

CREATE INDEX idx_jobs_user ON public.discovery_jobs USING btree (user_id);

CREATE INDEX idx_lead_fingerprints_campaign ON public.lead_fingerprints USING btree (campaign_id);

CREATE UNIQUE INDEX idx_lead_fingerprints_conflict_session ON public.lead_fingerprints USING btree (fingerprint, session_user_id);

CREATE UNIQUE INDEX idx_lead_fingerprints_conflict_user ON public.lead_fingerprints USING btree (fingerprint, user_id);

CREATE INDEX idx_lead_fingerprints_created ON public.lead_fingerprints USING btree (created_at DESC);

CREATE INDEX idx_lead_fingerprints_lead_id ON public.lead_fingerprints USING btree (lead_id);

CREATE UNIQUE INDEX idx_lead_fingerprints_session_unique ON public.lead_fingerprints USING btree (fingerprint, session_user_id) WHERE (session_user_id IS NOT NULL);

CREATE INDEX idx_lead_fingerprints_user_id ON public.lead_fingerprints USING btree (user_id);

CREATE UNIQUE INDEX idx_lead_fingerprints_user_unique ON public.lead_fingerprints USING btree (fingerprint, user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_leads_campaign_id ON public.leads USING btree (campaign_id);

CREATE INDEX idx_leads_confidence_score ON public.leads USING btree (confidence_score);

CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at DESC);

CREATE INDEX idx_leads_session_user_id ON public.leads USING btree (session_user_id);

CREATE INDEX idx_leads_user_id ON public.leads USING btree (user_id);

CREATE INDEX idx_leads_user_session ON public.leads USING btree (user_id, session_user_id);

CREATE INDEX idx_payment_methods_user_id ON public.payment_methods USING btree (user_id);

CREATE INDEX idx_payment_transactions_campaign_id ON public.payment_transactions USING btree (campaign_id);

CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions USING btree (user_id);

CREATE INDEX idx_usage_logs_timestamp ON public.usage_logs USING btree ("timestamp");

CREATE INDEX idx_usage_logs_user_id ON public.usage_logs USING btree (user_id);

CREATE INDEX idx_user_campaign_results_business_id ON public.user_campaign_results USING btree (business_identifier);

CREATE INDEX idx_user_campaign_results_campaign_id ON public.user_campaign_results USING btree (campaign_id);

CREATE INDEX idx_user_campaign_results_served_at ON public.user_campaign_results USING btree (served_at);

CREATE INDEX idx_user_campaign_results_session_hash ON public.user_campaign_results USING btree (session_user_id, campaign_hash) WHERE ((user_id IS NULL) AND (session_user_id IS NOT NULL));

CREATE INDEX idx_user_campaign_results_user_hash ON public.user_campaign_results USING btree (user_id, campaign_hash) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions USING btree (status);

CREATE INDEX idx_user_subscriptions_tier_id ON public.user_subscriptions USING btree (tier_id);

CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions USING btree (user_id);

CREATE UNIQUE INDEX lead_fingerprints_pkey ON public.lead_fingerprints USING btree (id);

CREATE UNIQUE INDEX leads_pkey ON public.leads USING btree (id);

CREATE UNIQUE INDEX payment_methods_pkey ON public.payment_methods USING btree (id);

CREATE UNIQUE INDEX payment_transactions_pkey ON public.payment_transactions USING btree (id);

CREATE UNIQUE INDEX subscription_tiers_name_key ON public.subscription_tiers USING btree (name);

CREATE UNIQUE INDEX subscription_tiers_pkey ON public.subscription_tiers USING btree (id);

CREATE UNIQUE INDEX uniq_user_campaign_results_session_hash ON public.user_campaign_results USING btree (session_user_id, campaign_hash, business_identifier) WHERE ((user_id IS NULL) AND (session_user_id IS NOT NULL));

CREATE UNIQUE INDEX uniq_user_campaign_results_user_hash ON public.user_campaign_results USING btree (user_id, campaign_hash, business_identifier) WHERE (user_id IS NOT NULL);

CREATE UNIQUE INDEX usage_logs_pkey ON public.usage_logs USING btree (id);

CREATE UNIQUE INDEX user_campaign_results_pkey ON public.user_campaign_results USING btree (id);

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);

CREATE UNIQUE INDEX user_subscriptions_pkey ON public.user_subscriptions USING btree (id);

CREATE UNIQUE INDEX user_subscriptions_user_id_key ON public.user_subscriptions USING btree (user_id);

alter table "public"."campaign_request_snapshots" add constraint "campaign_request_snapshots_pkey" PRIMARY KEY using index "campaign_request_snapshots_pkey";

alter table "public"."campaigns" add constraint "campaigns_pkey" PRIMARY KEY using index "campaigns_pkey";

alter table "public"."dashboard_exports" add constraint "dashboard_exports_pkey" PRIMARY KEY using index "dashboard_exports_pkey";

alter table "public"."discovery_jobs" add constraint "discovery_jobs_pkey" PRIMARY KEY using index "discovery_jobs_pkey";

alter table "public"."enhanced_api_usage" add constraint "enhanced_api_usage_pkey" PRIMARY KEY using index "enhanced_api_usage_pkey";

alter table "public"."enhanced_leads" add constraint "enhanced_leads_pkey" PRIMARY KEY using index "enhanced_leads_pkey";

alter table "public"."enrichment_cache" add constraint "enrichment_cache_pkey" PRIMARY KEY using index "enrichment_cache_pkey";

alter table "public"."enrichment_cache_stats" add constraint "enrichment_cache_stats_pkey" PRIMARY KEY using index "enrichment_cache_stats_pkey";

alter table "public"."function_logs" add constraint "function_logs_pkey" PRIMARY KEY using index "function_logs_pkey";

alter table "public"."lead_fingerprints" add constraint "lead_fingerprints_pkey" PRIMARY KEY using index "lead_fingerprints_pkey";

alter table "public"."leads" add constraint "leads_pkey" PRIMARY KEY using index "leads_pkey";

alter table "public"."payment_methods" add constraint "payment_methods_pkey" PRIMARY KEY using index "payment_methods_pkey";

alter table "public"."payment_transactions" add constraint "payment_transactions_pkey" PRIMARY KEY using index "payment_transactions_pkey";

alter table "public"."subscription_tiers" add constraint "subscription_tiers_pkey" PRIMARY KEY using index "subscription_tiers_pkey";

alter table "public"."usage_logs" add constraint "usage_logs_pkey" PRIMARY KEY using index "usage_logs_pkey";

alter table "public"."user_campaign_results" add constraint "user_campaign_results_pkey" PRIMARY KEY using index "user_campaign_results_pkey";

alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_pkey" PRIMARY KEY using index "user_subscriptions_pkey";

alter table "public"."campaign_request_snapshots" add constraint "campaign_request_snapshots_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE not valid;

alter table "public"."campaign_request_snapshots" validate constraint "campaign_request_snapshots_campaign_id_fkey";

alter table "public"."campaign_request_snapshots" add constraint "campaign_request_snapshots_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."campaign_request_snapshots" validate constraint "campaign_request_snapshots_user_id_fkey";

alter table "public"."campaigns" add constraint "campaigns_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."campaigns" validate constraint "campaigns_user_id_fkey";

alter table "public"."dashboard_exports" add constraint "dashboard_exports_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES campaigns(id) not valid;

alter table "public"."dashboard_exports" validate constraint "dashboard_exports_campaign_id_fkey";

alter table "public"."dashboard_exports" add constraint "dashboard_exports_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."dashboard_exports" validate constraint "dashboard_exports_user_id_fkey";

alter table "public"."discovery_jobs" add constraint "discovery_jobs_progress_check" CHECK (((progress >= 0) AND (progress <= 100))) not valid;

alter table "public"."discovery_jobs" validate constraint "discovery_jobs_progress_check";

alter table "public"."discovery_jobs" add constraint "discovery_jobs_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."discovery_jobs" validate constraint "discovery_jobs_status_check";

alter table "public"."discovery_jobs" add constraint "discovery_jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."discovery_jobs" validate constraint "discovery_jobs_user_id_fkey";

alter table "public"."enhanced_leads" add constraint "enhanced_leads_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES campaigns(id) not valid;

alter table "public"."enhanced_leads" validate constraint "enhanced_leads_campaign_id_fkey";

alter table "public"."enhanced_leads" add constraint "enhanced_leads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."enhanced_leads" validate constraint "enhanced_leads_user_id_fkey";

alter table "public"."enrichment_cache" add constraint "enrichment_cache_cache_key_key" UNIQUE using index "enrichment_cache_cache_key_key";

alter table "public"."enrichment_cache_stats" add constraint "enrichment_cache_stats_date_request_type_key" UNIQUE using index "enrichment_cache_stats_date_request_type_key";

alter table "public"."lead_fingerprints" add constraint "lead_fingerprints_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE not valid;

alter table "public"."lead_fingerprints" validate constraint "lead_fingerprints_campaign_id_fkey";

alter table "public"."lead_fingerprints" add constraint "lead_fingerprints_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE not valid;

alter table "public"."lead_fingerprints" validate constraint "lead_fingerprints_lead_id_fkey";

alter table "public"."lead_fingerprints" add constraint "lead_fingerprints_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."lead_fingerprints" validate constraint "lead_fingerprints_user_id_fkey";

alter table "public"."leads" add constraint "leads_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES campaigns(id) not valid;

alter table "public"."leads" validate constraint "leads_campaign_id_fkey";

alter table "public"."leads" add constraint "leads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."leads" validate constraint "leads_user_id_fkey";

alter table "public"."payment_methods" add constraint "payment_methods_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."payment_methods" validate constraint "payment_methods_user_id_fkey";

alter table "public"."payment_transactions" add constraint "payment_transactions_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES campaigns(id) not valid;

alter table "public"."payment_transactions" validate constraint "payment_transactions_campaign_id_fkey";

alter table "public"."payment_transactions" add constraint "payment_transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."payment_transactions" validate constraint "payment_transactions_user_id_fkey";

alter table "public"."subscription_tiers" add constraint "subscription_tiers_name_key" UNIQUE using index "subscription_tiers_name_key";

alter table "public"."usage_logs" add constraint "usage_logs_action_type_check" CHECK (((action_type)::text = ANY ((ARRAY['search'::character varying, 'export'::character varying])::text[]))) not valid;

alter table "public"."usage_logs" validate constraint "usage_logs_action_type_check";

alter table "public"."usage_logs" add constraint "usage_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."usage_logs" validate constraint "usage_logs_user_id_fkey";

alter table "public"."user_campaign_results" add constraint "user_campaign_results_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES campaigns(id) not valid;

alter table "public"."user_campaign_results" validate constraint "user_campaign_results_campaign_id_fkey";

alter table "public"."user_campaign_results" add constraint "user_campaign_results_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."user_campaign_results" validate constraint "user_campaign_results_user_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_id_fkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'cancelled'::character varying, 'expired'::character varying])::text[]))) not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_status_check";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_tier_id_fkey" FOREIGN KEY (tier_id) REFERENCES subscription_tiers(id) not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_tier_id_fkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_user_id_fkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_user_id_key" UNIQUE using index "user_subscriptions_user_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auto_generate_campaign_name()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Only generate if not already set
  IF NEW.generated_name IS NULL OR NEW.generated_name = '' THEN
    NEW.generated_name := public.generate_campaign_name(
      NEW.business_type,
      NEW.location,
      NEW.user_id
    );
  END IF;
  
  -- Set display name if not provided
  IF NEW.display_name IS NULL OR NEW.display_name = '' THEN
    NEW.display_name := NEW.business_type || ' in ' || NEW.location;
  END IF;
  
  -- Store name components
  NEW.name_components := jsonb_build_object(
    'business_type', NEW.business_type,
    'location', NEW.location,
    'generated_at', NOW(),
    'user_id', NEW.user_id
  );
  
  RETURN NEW;
END;
$function$
;

create or replace view "public"."cache_performance_summary" as  SELECT date,
    sum(COALESCE(total_requests, 0)) AS daily_requests,
    sum(COALESCE(cache_hits, 0)) AS daily_hits,
    sum(COALESCE(cache_misses, 0)) AS daily_misses,
    round(
        CASE
            WHEN (sum(COALESCE(total_requests, 0)) > 0) THEN (((sum(COALESCE(cache_hits, 0)))::numeric / (sum(COALESCE(total_requests, 0)))::numeric) * (100)::numeric)
            ELSE (0)::numeric
        END, 2) AS daily_hit_ratio,
    sum(COALESCE(cost_saved, (0)::numeric)) AS daily_cost_saved,
    sum(COALESCE(total_cost, (0)::numeric)) AS daily_total_cost
   FROM enrichment_cache_stats
  WHERE (date IS NOT NULL)
  GROUP BY date
  ORDER BY date DESC;


create or replace view "public"."campaign_analytics" as  SELECT c.id,
    c.business_type,
    c.location,
    c.target_count,
    c.min_confidence_score,
    c.status,
    c.results_count,
    c.total_cost,
    c.budget_limit,
    c.processing_time_ms,
    c.created_at,
    c.user_id,
    c.session_user_id,
    count(l.id) AS actual_leads,
    (COALESCE(avg(l.confidence_score), (0)::numeric))::numeric(10,2) AS avg_confidence
   FROM (campaigns c
     LEFT JOIN leads l ON ((l.campaign_id = c.id)))
  GROUP BY c.id, c.business_type, c.location, c.target_count, c.min_confidence_score, c.status, c.results_count, c.total_cost, c.budget_limit, c.processing_time_ms, c.created_at, c.user_id, c.session_user_id;


create or replace view "public"."campaign_analytics_enhanced" as  SELECT c.id,
    c.generated_name,
    c.display_name,
    c.business_type,
    c.location,
    c.target_count,
    c.min_confidence_score,
    c.status,
    c.results_count,
    c.total_cost,
    c.user_budget,
    c.budget_limit,
    c.processing_time_ms,
    c.created_at,
    c.user_id,
    c.session_user_id,
    up.email AS user_email,
    up.full_name AS user_name,
    count(l.id) AS actual_leads,
    (COALESCE(avg(l.confidence_score), (0)::numeric))::numeric(10,2) AS avg_confidence,
    (c.total_cost <= c.user_budget) AS within_budget
   FROM ((campaigns c
     LEFT JOIN leads l ON ((l.campaign_id = c.id)))
     LEFT JOIN user_profiles up ON ((up.id = c.user_id)))
  WHERE ((c.user_id = ( SELECT auth.uid() AS uid)) OR ((auth.uid() IS NULL) AND (c.session_user_id IS NOT NULL)))
  GROUP BY c.id, c.generated_name, c.display_name, c.business_type, c.location, c.target_count, c.min_confidence_score, c.status, c.results_count, c.total_cost, c.user_budget, c.budget_limit, c.processing_time_ms, c.created_at, c.user_id, c.session_user_id, up.email, up.full_name;


CREATE OR REPLACE FUNCTION public.check_usage_limit(user_uuid uuid, action_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  subscription_record RECORD;
  current_usage INTEGER;
  max_allowed INTEGER;
  can_proceed BOOLEAN;
BEGIN
  -- Get user subscription with tier info
  SELECT us.*, st.max_searches, st.max_exports, st.name AS tier_name
  INTO subscription_record
  FROM public.user_subscriptions us
  JOIN public.subscription_tiers st ON us.tier_id = st.id
  WHERE us.user_id = user_uuid AND us.status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'can_proceed', false,
      'usage', 0,
      'limit', 0,
      'error', 'No active subscription found'
    );
  END IF;

  -- Reset monthly usage if period has ended
  IF subscription_record.current_period_end < NOW() THEN
    UPDATE public.user_subscriptions
    SET
      current_period_start = NOW(),
      current_period_end = NOW() + INTERVAL '30 days',
      searches_used = 0,
      exports_used = 0
    WHERE user_id = user_uuid;

    -- Refresh the record
    SELECT us.*, st.max_searches, st.max_exports, st.name AS tier_name
    INTO subscription_record
    FROM public.user_subscriptions us
    JOIN public.subscription_tiers st ON us.tier_id = st.id
    WHERE us.user_id = user_uuid AND us.status = 'active';
  END IF;

  -- Check limits based on action type
  IF action_type = 'search' THEN
    current_usage := subscription_record.searches_used;
    max_allowed := subscription_record.max_searches;
  ELSIF action_type = 'export' THEN
    current_usage := subscription_record.exports_used;
    max_allowed := subscription_record.max_exports;
  ELSE
    RETURN json_build_object(
      'can_proceed', false,
      'usage', 0,
      'limit', 0,
      'error', 'Invalid action type'
    );
  END IF;

  -- Check if action is allowed (-1 means unlimited)
  can_proceed := (max_allowed = -1) OR (current_usage < max_allowed);

  RETURN json_build_object(
    'can_proceed', can_proceed,
    'usage', current_usage,
    'limit', max_allowed,
    'tier', subscription_record.tier_name,
    'period_end', subscription_record.current_period_end
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.enrichment_cache
  WHERE expires_at <= NOW() OR is_active = false;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_deduplication_records(days_to_keep integer DEFAULT 90)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_campaign_results
  WHERE served_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_jobs(retention_days integer DEFAULT 30)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM discovery_jobs
  WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_profile_and_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- Create free subscription (assuming Free tier exists with id = 1)
  INSERT INTO public.user_subscriptions (user_id, tier_id)
  VALUES (NEW.id, (
    SELECT id FROM public.subscription_tiers WHERE name = 'Free' LIMIT 1
  ));

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.current_session_identifier()
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN COALESCE(auth.jwt() ->> 'session_id', auth.uid()::text);
END;
$function$
;

create or replace view "public"."enrichment_cache_analytics" as  SELECT request_type,
    count(*) AS total_entries,
    sum(COALESCE(hit_count, 0)) AS total_hits,
    avg(COALESCE(confidence_score, 0)) AS avg_confidence,
    sum(COALESCE(cost, (0)::numeric)) AS total_cost_saved,
    round(avg(COALESCE(hit_count, 0)), 2) AS avg_hit_count,
    min(created_at) AS oldest_entry,
    max(last_accessed_at) AS last_activity,
    count(*) FILTER (WHERE (expires_at > now())) AS active_entries,
    count(*) FILTER (WHERE (expires_at <= now())) AS expired_entries
   FROM enrichment_cache
  WHERE (request_type IS NOT NULL)
  GROUP BY request_type
  ORDER BY (sum(COALESCE(hit_count, 0))) DESC;


CREATE OR REPLACE FUNCTION public.filter_already_served_businesses(p_user_id uuid, p_session_user_id text, p_campaign_hash text, p_business_identifiers text[])
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  served_identifiers TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT ARRAY_AGG(business_identifier)
      INTO served_identifiers
    FROM public.user_campaign_results
    WHERE user_id = p_user_id
      AND campaign_hash = p_campaign_hash
      AND business_identifier = ANY(p_business_identifiers);
  ELSIF p_session_user_id IS NOT NULL THEN
    SELECT ARRAY_AGG(business_identifier)
      INTO served_identifiers
    FROM public.user_campaign_results
    WHERE session_user_id = p_session_user_id
      AND campaign_hash = p_campaign_hash
      AND business_identifier = ANY(p_business_identifiers);
  ELSE
    RETURN p_business_identifiers;
  END IF;

  RETURN (
    SELECT COALESCE(ARRAY_AGG(identifier), ARRAY[]::TEXT[])
    FROM unnest(p_business_identifiers) AS identifier
    WHERE identifier != ALL(COALESCE(served_identifiers, ARRAY[]::TEXT[]))
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_business_identifier(business_name text, business_address text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN encode(digest(
    COALESCE(business_name, '') || '|' || COALESCE(business_address, ''),
    'sha256'
  ), 'base64');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_cache_key(p_request_type text, p_params jsonb)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN encode(
    digest(COALESCE(p_request_type, '') || '::' || COALESCE(p_params::TEXT, '{}'), 'sha256'),
    'hex'
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_campaign_hash(business_type text, location text, min_confidence_score integer DEFAULT 50)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN encode(digest(
    COALESCE(business_type, '') || '|' || COALESCE(location, '') || '|' || COALESCE(min_confidence_score, 50)::TEXT,
    'sha256'
  ), 'base64');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_campaign_name(business_type text, location text, user_id uuid DEFAULT NULL::uuid)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  business_code TEXT;
  location_code TEXT;
  date_string TEXT;
  time_string TEXT;
  user_code TEXT;
  random_component TEXT;
  campaign_name TEXT;
BEGIN
  -- Generate business type code (first 4 letters, uppercase)
  business_code := UPPER(LEFT(REGEXP_REPLACE(business_type, '[^a-zA-Z]', '', 'g'), 4));
  
  -- Generate location code (first 4 letters, uppercase)
  location_code := UPPER(LEFT(REGEXP_REPLACE(location, '[^a-zA-Z]', '', 'g'), 4));
  
  -- Generate date and time strings
  date_string := TO_CHAR(NOW(), 'YYYYMMDD');
  time_string := TO_CHAR(CLOCK_TIMESTAMP(), 'HH24MISSUS');
  
  -- Generate user code (last 6 chars of user_id or random for anonymous)
  IF user_id IS NOT NULL THEN
    user_code := RIGHT(user_id::TEXT, 6);
  ELSE
    user_code := SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
  END IF;

  -- Add extra entropy to avoid collisions on rapid submissions
  random_component := SUBSTRING(MD5((RANDOM()::TEXT || NOW()::TEXT)) FROM 1 FOR 6);
  
  -- Combine into final campaign name
  campaign_name := business_code || '_' || location_code || '_' || date_string || '_' || time_string || '_' || user_code || '_' || random_component;
  
  RETURN campaign_name;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_cached_response(p_request_type text, p_params jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cache_key TEXT;
  v_response JSONB;
BEGIN
  v_cache_key := public.generate_cache_key(p_request_type, p_params);

  SELECT response_data INTO v_response
  FROM public.enrichment_cache
  WHERE cache_key = v_cache_key
    AND expires_at > NOW()
    AND is_active = true;

  IF v_response IS NOT NULL THEN
    UPDATE public.enrichment_cache
    SET hit_count = COALESCE(hit_count, 0) + 1,
        last_accessed_at = NOW(),
        updated_at = NOW()
    WHERE cache_key = v_cache_key;

    INSERT INTO public.enrichment_cache_stats (date, request_type, cache_hits, total_requests)
    VALUES (CURRENT_DATE, p_request_type, 1, 1)
    ON CONFLICT (date, request_type)
    DO UPDATE SET
      cache_hits = public.enrichment_cache_stats.cache_hits + 1,
      total_requests = public.enrichment_cache_stats.total_requests + 1,
      hit_ratio = ROUND(
        (public.enrichment_cache_stats.cache_hits + 1.0) /
        (public.enrichment_cache_stats.total_requests + 1.0) * 100,
        2
      ),
      updated_at = NOW();
  ELSE
    INSERT INTO public.enrichment_cache_stats (date, request_type, cache_misses, total_requests)
    VALUES (CURRENT_DATE, p_request_type, 1, 1)
    ON CONFLICT (date, request_type)
    DO UPDATE SET
      cache_misses = public.enrichment_cache_stats.cache_misses + 1,
      total_requests = public.enrichment_cache_stats.total_requests + 1,
      hit_ratio = ROUND(
        public.enrichment_cache_stats.cache_hits /
        (public.enrichment_cache_stats.total_requests + 1.0) * 100,
        2
      ),
      updated_at = NOW();
  END IF;

  RETURN v_response;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_function_summary(p_function text, p_hours integer DEFAULT 24)
 RETURNS json
 LANGUAGE sql
AS $function$
SELECT json_build_object(
    'function', p_function,
    'window_hours', p_hours,
    'total_logs', count(*),
    'error_count', count(*) FILTER (WHERE level = 'error'),
    'warn_count', count(*) FILTER (WHERE level = 'warn'),
    'avg_duration_ms', avg(duration_ms),
    'recent_errors', (
        SELECT json_agg(message)
        FROM (
            SELECT message 
            FROM public.function_logs 
            WHERE function_name = p_function 
                AND level = 'error'
                AND ts >= now() - interval '1 hour' * p_hours
            ORDER BY ts DESC 
            LIMIT 5
        ) recent
    )
)
FROM public.function_logs
WHERE function_name = p_function 
    AND ts >= now() - interval '1 hour' * p_hours;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_campaigns(target_user_id uuid DEFAULT NULL::uuid, target_session_user_id text DEFAULT NULL::text)
 RETURNS TABLE(id text, business_type text, location text, target_count integer, results_count integer, status text, total_cost numeric, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  effective_user_id UUID;
  effective_session_id TEXT;
BEGIN
  IF target_user_id IS NOT NULL THEN
    effective_user_id := target_user_id;
  ELSE
    effective_user_id := auth.uid();
  END IF;

  IF target_session_user_id IS NOT NULL THEN
    effective_session_id := target_session_user_id;
  ELSE
    effective_session_id := public.current_session_identifier();
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.business_type,
    c.location,
    c.target_count,
    c.results_count,
    c.status,
    c.total_cost,
    c.created_at
  FROM public.campaigns c
  WHERE (
    effective_user_id IS NOT NULL AND c.user_id = effective_user_id
  ) OR (
    effective_user_id IS NULL AND effective_session_id IS NOT NULL AND c.session_user_id = effective_session_id
  )
  ORDER BY c.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_usage_stats(target_user_id uuid DEFAULT NULL::uuid, target_session_user_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  effective_user_id UUID := target_user_id;
  effective_session_id TEXT := target_session_user_id;
  campaigns_count INTEGER := 0;
  leads_count INTEGER := 0;
  exports_count INTEGER := 0;
  total_cost DECIMAL(10,4) := 0;
  month_campaigns INTEGER := 0;
  month_cost DECIMAL(10,4) := 0;
  last_activity TIMESTAMPTZ;
  dedup_savings INTEGER := 0;
BEGIN
  IF effective_user_id IS NULL THEN
    effective_user_id := auth.uid();
  END IF;

  IF effective_session_id IS NULL THEN
    effective_session_id := public.current_session_identifier();
  END IF;

  SELECT
    COUNT(DISTINCT c.id),
    COUNT(l.id),
    COALESCE(SUM(c.total_cost), 0),
    COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= date_trunc('month', NOW())),
    COALESCE(SUM(c.total_cost) FILTER (WHERE c.created_at >= date_trunc('month', NOW())), 0),
    MAX(c.created_at)
  INTO campaigns_count, leads_count, total_cost, month_campaigns, month_cost, last_activity
  FROM public.campaigns c
  LEFT JOIN public.leads l ON l.campaign_id = c.id
  WHERE (
    effective_user_id IS NOT NULL AND c.user_id = effective_user_id
  ) OR (
    effective_user_id IS NULL AND effective_session_id IS NOT NULL AND c.session_user_id = effective_session_id
  );

  SELECT COUNT(*) INTO exports_count
  FROM public.dashboard_exports de
  WHERE (
    effective_user_id IS NOT NULL AND de.user_id = effective_user_id
  ) OR (
    effective_user_id IS NULL AND effective_session_id IS NOT NULL AND de.session_user_id = effective_session_id
  );

  SELECT COUNT(*) INTO dedup_savings
  FROM public.user_campaign_results ucr
  WHERE (
    effective_user_id IS NOT NULL AND ucr.user_id = effective_user_id
  ) OR (
    effective_user_id IS NULL AND effective_session_id IS NOT NULL AND ucr.session_user_id = effective_session_id
  );

  RETURN jsonb_build_object(
    'user_id', effective_user_id,
    'session_user_id', effective_session_id,
    'total_campaigns', campaigns_count,
    'total_leads_generated', leads_count,
    'total_exports', exports_count,
    'total_cost', total_cost,
    'current_month_campaigns', month_campaigns,
    'current_month_cost', month_cost,
    'last_activity', last_activity,
    'deduplication_saves', dedup_savings,
    'fresh_results_guaranteed', true,
    'timestamp', NOW()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_usage(user_uuid uuid, action_type text, campaign_id_param text DEFAULT NULL::text, cost_param numeric DEFAULT 0)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log the usage
  INSERT INTO public.usage_logs (user_id, action_type, campaign_id, cost)
  VALUES (user_uuid, action_type, campaign_id_param, cost_param);

  -- Increment the appropriate counter
  IF action_type = 'search' THEN
    UPDATE public.user_subscriptions
    SET searches_used = searches_used + 1
    WHERE user_id = user_uuid;
  ELSIF action_type = 'export' THEN
    UPDATE public.user_subscriptions
    SET exports_used = exports_used + 1
    WHERE user_id = user_uuid;
  END IF;

  RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.link_anonymous_campaigns_to_user(target_session_user_id text, authenticated_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  linked_total INTEGER := 0;
BEGIN
  UPDATE public.campaigns
  SET user_id = authenticated_user_id
  WHERE user_id IS NULL
    AND session_user_id = target_session_user_id;

  GET DIAGNOSTICS linked_total = ROW_COUNT;

  UPDATE public.leads
  SET user_id = authenticated_user_id
  WHERE user_id IS NULL
    AND session_user_id = target_session_user_id;

  UPDATE public.dashboard_exports
  SET user_id = authenticated_user_id
  WHERE user_id IS NULL
    AND session_user_id = target_session_user_id;

  RETURN linked_total;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_served_businesses(p_user_id uuid, p_session_user_id text, p_campaign_hash text, p_campaign_id text, p_businesses jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  business_record JSONB;
  inserted_count INTEGER := 0;
BEGIN
  FOR business_record IN SELECT * FROM jsonb_array_elements(p_businesses)
  LOOP
    BEGIN
      INSERT INTO public.user_campaign_results (
        user_id,
        session_user_id,
        campaign_hash,
        business_identifier,
        campaign_id,
        business_name,
        business_address
      ) VALUES (
        p_user_id,
        p_session_user_id,
        p_campaign_hash,
        business_record ->> 'identifier',
        p_campaign_id,
        business_record ->> 'name',
        business_record ->> 'address'
      );
      inserted_count := inserted_count + 1;
    EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;
  END LOOP;

  RETURN inserted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.store_cached_response(p_request_type text, p_params jsonb, p_response jsonb, p_cost numeric DEFAULT 0, p_confidence_score integer DEFAULT 0)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cache_key TEXT;
BEGIN
  v_cache_key := public.generate_cache_key(p_request_type, p_params);

  -- Store with 90-day expiration
  INSERT INTO public.enrichment_cache (
    cache_key,
    request_type,
    request_params,
    response_data,
    cost,
    confidence_score,
    expires_at
  ) VALUES (
    v_cache_key,
    p_request_type,
    p_params,
    p_response,
    p_cost,
    p_confidence_score,
    NOW() + INTERVAL '90 days'
  ) ON CONFLICT (cache_key)
  DO UPDATE SET
    response_data = EXCLUDED.response_data,
    cost = EXCLUDED.cost,
    confidence_score = EXCLUDED.confidence_score,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW();

  RETURN v_cache_key;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.store_cached_response(p_request_type text, p_params jsonb, p_response jsonb, p_cost numeric DEFAULT 0, p_confidence_score integer DEFAULT 0, p_ttl interval DEFAULT '90 days'::interval)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cache_key TEXT;
BEGIN
  v_cache_key := public.generate_cache_key(p_request_type, p_params);

  INSERT INTO public.enrichment_cache (
    cache_key,
    request_type,
    request_params,
    response_data,
    cost,
    confidence_score,
    expires_at,
    updated_at,
    last_accessed_at,
    is_active
  ) VALUES (
    v_cache_key,
    p_request_type,
    p_params,
    p_response,
    p_cost,
    p_confidence_score,
    NOW() + p_ttl,
    NOW(),
    NOW(),
    true
  )
  ON CONFLICT (cache_key) DO UPDATE SET
    response_data = EXCLUDED.response_data,
    cost = EXCLUDED.cost,
    confidence_score = EXCLUDED.confidence_score,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW(),
    last_accessed_at = NOW(),
    is_active = true;

  INSERT INTO public.enrichment_cache_stats (date, request_type, total_cost)
  VALUES (CURRENT_DATE, p_request_type, p_cost)
  ON CONFLICT (date, request_type)
  DO UPDATE SET
    total_cost = public.enrichment_cache_stats.total_cost + p_cost,
    updated_at = NOW();

  RETURN v_cache_key;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_discovery_jobs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_spending(user_id_param uuid, amount_param numeric)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.user_profiles
  SET 
    total_spent = total_spent + amount_param,
    updated_at = NOW()
  WHERE id = user_id_param;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_api_key_format(api_key text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  IF api_key LIKE 'sb_publishable_%' THEN
    RETURN true;
  END IF;

  IF api_key LIKE 'sb_secret_%' THEN
    RETURN true;
  END IF;

  IF api_key LIKE 'eyJ%' AND length(api_key) > 100 THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_security_configuration()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  rls_count INTEGER;
  policy_count INTEGER;
  secure_function_count INTEGER;
  result JSONB;
BEGIN
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true
    AND t.tablename IN ('campaigns', 'leads', 'dashboard_exports', 'user_campaign_results');

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('campaigns', 'leads', 'dashboard_exports', 'user_campaign_results');

  SELECT COUNT(*) INTO secure_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'current_session_identifier',
      'get_user_campaigns',
      'link_anonymous_campaigns_to_user',
      'generate_campaign_hash',
      'generate_business_identifier',
      'filter_already_served_businesses',
      'record_served_businesses',
      'get_user_usage_stats',
      'generate_cache_key',
      'get_cached_response',
      'store_cached_response',
      'cleanup_expired_cache'
    );

  result := jsonb_build_object(
    'timestamp', NOW(),
    'rls_enabled_tables', rls_count,
    'policy_count', policy_count,
    'secure_function_count', secure_function_count,
    'session_support', true,
    'user_campaign_linking', true,
    'cache_enabled', true,
    'deduplication_enabled', true
  );

  RETURN result;
END;
$function$
;

create policy "campaign_request_snapshots_select_self"
on "public"."campaign_request_snapshots"
as permissive
for select
to public
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "campaigns_authenticated_access"
on "public"."campaigns"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "campaigns_authenticated_insert"
on "public"."campaigns"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "campaigns_authenticated_update"
on "public"."campaigns"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "campaigns_session_access"
on "public"."campaigns"
as permissive
for select
to anon
using ((((( SELECT current_setting('request.jwt.claims'::text, true) AS current_setting))::jsonb ->> 'session_id'::text) = session_user_id));


create policy "campaigns_session_insert"
on "public"."campaigns"
as permissive
for insert
to anon
with check ((((( SELECT current_setting('request.jwt.claims'::text, true) AS current_setting))::jsonb ->> 'session_id'::text) = session_user_id));


create policy "dashboard_exports_authenticated_access"
on "public"."dashboard_exports"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "dashboard_exports_authenticated_insert"
on "public"."dashboard_exports"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "dashboard_exports_session_access"
on "public"."dashboard_exports"
as permissive
for select
to anon
using ((((( SELECT current_setting('request.jwt.claims'::text, true) AS current_setting))::jsonb ->> 'session_id'::text) = session_user_id));


create policy "dashboard_exports_session_insert"
on "public"."dashboard_exports"
as permissive
for insert
to anon
with check ((((( SELECT current_setting('request.jwt.claims'::text, true) AS current_setting))::jsonb ->> 'session_id'::text) = session_user_id));


create policy "dashboard_exports_user_access"
on "public"."dashboard_exports"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "jobs_insert_own"
on "public"."discovery_jobs"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "jobs_select_own"
on "public"."discovery_jobs"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "service_role_enhanced_api_usage_access"
on "public"."enhanced_api_usage"
as permissive
for all
to authenticated
using (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text))
with check (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text));


create policy "anonymous_session_enhanced_leads_access"
on "public"."enhanced_leads"
as permissive
for all
to anon
using (((session_user_id IS NOT NULL) AND (campaign_id IN ( SELECT campaigns.id
   FROM campaigns
  WHERE (campaigns.session_user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_user_id'::text))))));


create policy "enhanced_leads_campaign_access"
on "public"."enhanced_leads"
as permissive
for all
to authenticated
using ((campaign_id IN ( SELECT campaigns.id
   FROM campaigns
  WHERE (campaigns.user_id = auth.uid()))));


create policy "service_role_enhanced_leads_access"
on "public"."enhanced_leads"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "enrichment_cache_service_access"
on "public"."enrichment_cache"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "enrichment_cache_stats_service_access"
on "public"."enrichment_cache_stats"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "deny_all_function_logs"
on "public"."function_logs"
as permissive
for all
to authenticated
using (false)
with check (false);


create policy "lead_fingerprints_select_self"
on "public"."lead_fingerprints"
as permissive
for select
to public
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "System can insert leads"
on "public"."leads"
as permissive
for insert
to public
with check (true);


create policy "leads_anon_insert"
on "public"."leads"
as permissive
for insert
to anon
with check ((((( SELECT current_setting('request.jwt.claims'::text, true) AS current_setting))::jsonb ->> 'session_id'::text) = session_user_id));


create policy "leads_anon_select"
on "public"."leads"
as permissive
for select
to anon
using ((((( SELECT current_setting('request.jwt.claims'::text, true) AS current_setting))::jsonb ->> 'session_id'::text) = session_user_id));


create policy "leads_auth_insert"
on "public"."leads"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "leads_auth_select"
on "public"."leads"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "payment_methods_authenticated_delete"
on "public"."payment_methods"
as permissive
for delete
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "payment_methods_authenticated_insert"
on "public"."payment_methods"
as permissive
for insert
to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "payment_methods_authenticated_select"
on "public"."payment_methods"
as permissive
for select
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "payment_methods_authenticated_update"
on "public"."payment_methods"
as permissive
for update
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "payment_tx_authenticated_delete"
on "public"."payment_transactions"
as permissive
for delete
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "payment_tx_authenticated_insert"
on "public"."payment_transactions"
as permissive
for insert
to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "payment_tx_authenticated_select"
on "public"."payment_transactions"
as permissive
for select
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "payment_tx_authenticated_update"
on "public"."payment_transactions"
as permissive
for update
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Anyone can view active subscription tiers"
on "public"."subscription_tiers"
as permissive
for select
to public
using ((is_active = true));


create policy "System can insert usage logs"
on "public"."usage_logs"
as permissive
for insert
to public
with check (true);


create policy "Users can view own usage"
on "public"."usage_logs"
as permissive
for select
to public
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "user_campaign_results_session_access"
on "public"."user_campaign_results"
as permissive
for select
to anon
using ((((( SELECT current_setting('request.jwt.claims'::text, true) AS current_setting))::jsonb ->> 'session_id'::text) = session_user_id));


create policy "user_campaign_results_user_access"
on "public"."user_campaign_results"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can insert own profile"
on "public"."user_profiles"
as permissive
for insert
to public
with check ((id = ( SELECT auth.uid() AS uid)));


create policy "Users can update own profile"
on "public"."user_profiles"
as permissive
for update
to public
using ((id = ( SELECT auth.uid() AS uid)));


create policy "Users can view own profile"
on "public"."user_profiles"
as permissive
for select
to public
using ((id = ( SELECT auth.uid() AS uid)));


create policy "Users can update own subscription"
on "public"."user_subscriptions"
as permissive
for update
to public
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Users can view own subscription"
on "public"."user_subscriptions"
as permissive
for select
to public
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "user_subs_authenticated_delete"
on "public"."user_subscriptions"
as permissive
for delete
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "user_subs_authenticated_insert"
on "public"."user_subscriptions"
as permissive
for insert
to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "user_subs_authenticated_select"
on "public"."user_subscriptions"
as permissive
for select
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "user_subs_authenticated_update"
on "public"."user_subscriptions"
as permissive
for update
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));


CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_auto_generate_campaign_name BEFORE INSERT ON public.campaigns FOR EACH ROW EXECUTE FUNCTION auto_generate_campaign_name();

CREATE TRIGGER trigger_update_discovery_jobs_updated_at BEFORE UPDATE ON public.discovery_jobs FOR EACH ROW EXECUTE FUNCTION update_discovery_jobs_updated_at();

CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


