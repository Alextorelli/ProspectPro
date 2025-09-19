-- FIX EXISTING TABLE: Add missing campaign_date column
-- Run this in Supabase SQL Editor to fix the column error
-- First, check if campaign_date column exists, if not add it
DO $$ BEGIN -- Add campaign_date column if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'campaign_analytics'
        AND column_name = 'campaign_date'
) THEN
ALTER TABLE campaign_analytics
ADD COLUMN campaign_date DATE NOT NULL DEFAULT CURRENT_DATE;
RAISE NOTICE 'Added campaign_date column to campaign_analytics table';
ELSE RAISE NOTICE 'campaign_date column already exists';
END IF;
-- Add other missing columns if they don't exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'campaign_analytics'
        AND column_name = 'validation_success_rate'
) THEN
ALTER TABLE campaign_analytics
ADD COLUMN validation_success_rate NUMERIC(5, 2);
RAISE NOTICE 'Added validation_success_rate column';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'campaign_analytics'
        AND column_name = 'api_calls_count'
) THEN
ALTER TABLE campaign_analytics
ADD COLUMN api_calls_count INTEGER DEFAULT 0;
RAISE NOTICE 'Added api_calls_count column';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'campaign_analytics'
        AND column_name = 'processing_time_seconds'
) THEN
ALTER TABLE campaign_analytics
ADD COLUMN processing_time_seconds INTEGER;
RAISE NOTICE 'Added processing_time_seconds column';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'campaign_analytics'
        AND column_name = 'quality_score'
) THEN
ALTER TABLE campaign_analytics
ADD COLUMN quality_score NUMERIC(5, 2);
RAISE NOTICE 'Added quality_score column';
END IF;
END $$;
-- Create index on campaign_date if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_date ON campaign_analytics(campaign_date);
-- Verify the fix
SELECT 'campaign_date column fix completed!' as status;
-- Show the current table structure
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'campaign_analytics'
ORDER BY ordinal_position;