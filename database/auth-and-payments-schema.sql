-- ProspectPro Auth & Payments Schema Update
-- October 7, 2025 - Production Ready Features

-- =============================================================================
-- PART 1: Campaign Naming & Ownership Enhancements
-- =============================================================================

-- Add campaign naming and enhanced user management
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS generated_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS display_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS name_components JSONB,
ADD COLUMN IF NOT EXISTS user_budget DECIMAL(10,4) DEFAULT 50.0,
ADD COLUMN IF NOT EXISTS budget_alerts_enabled BOOLEAN DEFAULT true;

-- Create index for efficient campaign searching
CREATE INDEX IF NOT EXISTS idx_campaigns_generated_name ON public.campaigns(generated_name);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_budget ON public.campaigns(user_budget);

-- =============================================================================
-- PART 2: User Profiles & Payment Information
-- =============================================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  total_spent DECIMAL(10,4) DEFAULT 0,
  monthly_budget DECIMAL(10,4) DEFAULT 100.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment methods table (Stripe integration)
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  stripe_payment_method_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'card', 'bank_account', etc.
  last_four TEXT,
  brand TEXT, -- 'visa', 'mastercard', etc.
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  campaign_id TEXT REFERENCES public.campaigns(id),
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,4) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL, -- 'pending', 'succeeded', 'failed'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 3: Enhanced RLS Policies
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Payment methods policies
CREATE POLICY "Users can view own payment methods" ON public.payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own payment methods" ON public.payment_methods
  FOR ALL USING (auth.uid() = user_id);

-- Payment transactions policies
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- PART 4: Campaign Naming Functions
-- =============================================================================

-- Generate campaign name function
CREATE OR REPLACE FUNCTION public.generate_campaign_name(
  business_type TEXT,
  location TEXT,
  user_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  business_code TEXT;
  location_code TEXT;
  date_string TEXT;
  time_string TEXT;
  user_code TEXT;
  campaign_name TEXT;
BEGIN
  -- Generate business type code (first 4 letters, uppercase)
  business_code := UPPER(LEFT(REGEXP_REPLACE(business_type, '[^a-zA-Z]', '', 'g'), 4));
  
  -- Generate location code (first 4 letters, uppercase)
  location_code := UPPER(LEFT(REGEXP_REPLACE(location, '[^a-zA-Z]', '', 'g'), 4));
  
  -- Generate date and time strings
  date_string := TO_CHAR(NOW(), 'YYYYMMDD');
  time_string := TO_CHAR(NOW(), 'HH24MISS');
  
  -- Generate user code (last 6 chars of user_id or random for anonymous)
  IF user_id IS NOT NULL THEN
    user_code := RIGHT(user_id::TEXT, 6);
  ELSE
    user_code := SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
  END IF;
  
  -- Combine into final campaign name
  campaign_name := business_code || '_' || location_code || '_' || date_string || '_' || time_string || '_' || user_code;
  
  RETURN campaign_name;
END;
$$;

-- Auto-generate campaign names trigger
CREATE OR REPLACE FUNCTION public.auto_generate_campaign_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
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
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_campaign_name ON public.campaigns;
CREATE TRIGGER trigger_auto_generate_campaign_name
  BEFORE INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_campaign_name();

-- =============================================================================
-- PART 5: User Profile Management Functions
-- =============================================================================

-- Create or update user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Trigger for user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- PART 6: Budget and Spending Tracking
-- =============================================================================

-- Update user spending function
CREATE OR REPLACE FUNCTION public.update_user_spending(
  user_id_param UUID,
  amount_param DECIMAL(10,4)
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    total_spent = total_spent + amount_param,
    updated_at = NOW()
  WHERE id = user_id_param;
END;
$$;

-- =============================================================================
-- PART 7: Enhanced Views
-- =============================================================================

-- Campaign analytics with user info
CREATE OR REPLACE VIEW public.campaign_analytics_enhanced
WITH (security_invoker = true)
AS SELECT
  c.id,
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
  up.email as user_email,
  up.full_name as user_name,
  COUNT(l.id) AS actual_leads,
  COALESCE(AVG(l.confidence_score), 0)::numeric(10,2) AS avg_confidence,
  (c.total_cost <= c.user_budget) AS within_budget
FROM campaigns c
LEFT JOIN leads l ON l.campaign_id = c.id
LEFT JOIN user_profiles up ON up.id = c.user_id
WHERE
  c.user_id = auth.uid() OR
  (auth.uid() IS NULL AND c.session_user_id IS NOT NULL)
GROUP BY c.id, c.generated_name, c.display_name, c.business_type, c.location, 
         c.target_count, c.min_confidence_score, c.status, c.results_count, 
         c.total_cost, c.user_budget, c.budget_limit, c.processing_time_ms, 
         c.created_at, c.user_id, c.session_user_id, up.email, up.full_name;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Test the campaign name generation
SELECT public.generate_campaign_name('coffee shop', 'Seattle, WA', NULL) as test_campaign_name;

COMMENT ON TABLE public.user_profiles IS 'Extended user profiles with subscription and budget info';
COMMENT ON TABLE public.payment_methods IS 'User payment methods stored via Stripe';
COMMENT ON TABLE public.payment_transactions IS 'Payment transaction history';
COMMENT ON FUNCTION public.generate_campaign_name IS 'Generates standardized campaign names';
COMMENT ON VIEW public.campaign_analytics_enhanced IS 'Enhanced campaign analytics with user context';

-- Final status
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔐 ProspectPro Auth & Payments Schema - October 7, 2025';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '✅ Campaign naming system implemented';
  RAISE NOTICE '✅ User profiles and payment tables created';
  RAISE NOTICE '✅ Enhanced RLS policies applied';
  RAISE NOTICE '✅ Budget tracking functions added';
  RAISE NOTICE '✅ Auto-trigger for campaign naming enabled';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready for: Auth integration, Stripe payments, UI updates';
  RAISE NOTICE '';
END $$;