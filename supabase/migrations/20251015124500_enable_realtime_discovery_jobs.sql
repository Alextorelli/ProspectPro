-- Enable realtime updates for discovery job tracking
-- Ensures the progress view in the frontend receives live updates
-- Ensure WAL includes the full row so Realtime subscribers get diffs
ALTER TABLE public.discovery_jobs REPLICA IDENTITY FULL;
-- Add discovery_jobs to the Supabase realtime publication (idempotent)
DO $$ BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.discovery_jobs';
EXCEPTION
WHEN duplicate_object THEN NULL;
END;
$$;