// Real-time Job Progress Hook for ProspectPro v4.2
// Subscribe to Supabase Real-time for live campaign updates

import { useCallback, useEffect, useRef, useState } from "react";
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
  new: DiscoveryJobRow;
}

type DiscoveryJobRow = {
  id: string;
  status: string;
  progress: number | null;
  current_stage: string | null;
  metrics: Record<string, number> | null;
  error?: string | null;
  completed_at?: string | null;
};

const NORMALIZED_STATUS: Record<string, JobProgress["status"]> = {
  pending: "pending",
  processing: "processing",
  completed: "completed",
  failed: "failed",
};

function normalizeStatus(
  value: string | null | undefined
): JobProgress["status"] {
  if (!value) {
    return "processing";
  }

  return NORMALIZED_STATUS[value] ?? "processing";
}

export function useJobProgress(jobId: string | null) {
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pollingRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const updateFromRow = useCallback(
    (row: DiscoveryJobRow | null) => {
      if (!row) {
        return;
      }

      const next: JobProgress = {
        jobId: row.id,
        status: normalizeStatus(row.status),
        progress: row.progress ?? 0,
        currentStage: row.current_stage ?? "processing",
        metrics: (row.metrics ?? undefined) as JobProgress["metrics"],
        error: row.error ?? undefined,
        completedAt: row.completed_at ?? undefined,
      };

      setProgress(next);

      if (next.status === "completed" || next.status === "failed") {
        stopPolling();
      }
    },
    [stopPolling]
  );

  const fetchStatus = useCallback(async (): Promise<DiscoveryJobRow | null> => {
    if (!jobId) {
      return null;
    }

    const { data, error } = await supabase
      .from("discovery_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error) {
      console.error("Error fetching job status:", error);
      return null;
    }

    updateFromRow(data);
    return data;
  }, [jobId, updateFromRow]);

  const startPolling = useCallback(() => {
    if (pollingRef.current !== null || !jobId) {
      return;
    }

    pollingRef.current = window.setInterval(() => {
      void fetchStatus();
    }, 4000);
  }, [fetchStatus, jobId]);

  useEffect(() => {
    if (!jobId) {
      setIsLoading(false);
      stopPolling();
      setProgress(null);
      return;
    }

    let isMounted = true;

    const bootstrap = async () => {
      const row = await fetchStatus();
      if (!isMounted) {
        return;
      }

      setIsLoading(false);

      if (!row) {
        return;
      }

      if (row.status !== "completed" && row.status !== "failed") {
        startPolling();
      }
    };

    void bootstrap();

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
          updateFromRow(payload.new);
        }
      )
      .subscribe((status) => {
        if (
          status === "TIMED_OUT" ||
          status === "CHANNEL_ERROR" ||
          status === "CLOSED"
        ) {
          console.warn(
            "Realtime subscription failed. Falling back to polling.",
            {
              status,
              jobId,
            }
          );
          startPolling();
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      stopPolling();
    };
  }, [fetchStatus, jobId, startPolling, stopPolling, updateFromRow]);

  return { progress, isLoading };
}

export const STAGE_LABELS: Record<string, string> = {
  initializing: "Initializing campaign...",
  discovering_businesses: "Discovering businesses...",
  scoring_businesses: "Scoring and qualifying leads...",
  enriching_contacts: "Enriching contact information...",
  storing_results: "Storing results...",
};

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
