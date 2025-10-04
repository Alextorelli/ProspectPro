// Real-time Job Progress Hook for ProspectPro v4.2
// Subscribe to Supabase Real-time for live campaign updates

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface JobProgress {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  currentStage: string;
  metrics?: {
    businesses_found?: number;
    qualified_leads?: number;
    leads_enriched?: number;
    total_cost?: number;
    total_found?: number;
    avg_confidence?: number;
  };
  error?: string;
  completedAt?: string;
}

interface RealtimePayload {
  new: {
    id: string;
    status: string;
    progress: number;
    current_stage: string;
    metrics: Record<string, number>;
    error?: string;
    completed_at?: string;
  };
}

export function useJobProgress(jobId: string | null) {
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!jobId) {
      setIsLoading(false);
      return;
    }

    // Fetch initial job status
    const fetchInitialStatus = async () => {
      const { data, error } = await supabase
        .from("discovery_jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) {
        console.error("Error fetching job status:", error);
        setIsLoading(false);
        return;
      }

      setProgress({
        jobId: data.id,
        status: data.status,
        progress: data.progress || 0,
        currentStage: data.current_stage || "initializing",
        metrics: data.metrics,
        error: data.error,
        completedAt: data.completed_at,
      });
      setIsLoading(false);
    };

    fetchInitialStatus();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`discovery_jobs:${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "discovery_jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload: RealtimePayload) => {
          console.log("Real-time update:", payload.new);

          setProgress({
            jobId: payload.new.id,
            status: payload.new.status as
              | "pending"
              | "processing"
              | "completed"
              | "failed",
            progress: payload.new.progress || 0,
            currentStage: payload.new.current_stage || "processing",
            metrics: payload.new.metrics,
            error: payload.new.error,
            completedAt: payload.new.completed_at,
          });
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return { progress, isLoading };
}

// Stage names for UI display
export const STAGE_LABELS: Record<string, string> = {
  initializing: "Initializing campaign...",
  discovering_businesses: "Discovering businesses...",
  scoring_businesses: "Scoring and qualifying leads...",
  enriching_contacts: "Enriching contact information...",
  storing_results: "Storing results...",
};

// Progress component (example)
export function JobProgressDisplay({ jobId }: { jobId: string }) {
  const { progress, isLoading } = useJobProgress(jobId);

  if (isLoading) {
    return <div>Loading job status...</div>;
  }

  if (!progress) {
    return <div>Job not found</div>;
  }

  if (progress.status === "failed") {
    return (
      <div className="error">
        <h3>Campaign Failed</h3>
        <p>{progress.error || "Unknown error occurred"}</p>
      </div>
    );
  }

  if (progress.status === "completed") {
    return (
      <div className="success">
        <h3>Campaign Completed! 🎉</h3>
        <p>Found {progress.metrics?.total_found || 0} qualified leads</p>
        <p>Total cost: ${progress.metrics?.total_cost?.toFixed(2) || "0.00"}</p>
        <p>
          Average confidence:{" "}
          {progress.metrics?.avg_confidence?.toFixed(0) || 0}%
        </p>
      </div>
    );
  }

  return (
    <div className="progress">
      <h3>Campaign In Progress</h3>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress.progress}%` }}
        />
      </div>
      <p>{progress.progress}% complete</p>
      <p className="stage">
        {STAGE_LABELS[progress.currentStage] || progress.currentStage}
      </p>

      {progress.metrics && (
        <div className="metrics">
          {progress.metrics.businesses_found && (
            <p>Businesses found: {progress.metrics.businesses_found}</p>
          )}
          {progress.metrics.qualified_leads && (
            <p>Qualified leads: {progress.metrics.qualified_leads}</p>
          )}
          {progress.metrics.leads_enriched && (
            <p>Enriched: {progress.metrics.leads_enriched}</p>
          )}
          {progress.metrics.total_cost && (
            <p>Cost: ${progress.metrics.total_cost.toFixed(2)}</p>
          )}
        </div>
      )}
    </div>
  );
}
