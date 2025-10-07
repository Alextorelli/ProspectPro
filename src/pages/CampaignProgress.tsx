import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ProgressDisplay } from "../components/ProgressDisplay";
import { useAuth } from "../contexts/AuthContext";
import { useJobProgress } from "../hooks/useJobProgress";
import { supabase } from "../lib/supabase";
import { useCampaignStore } from "../stores/campaignStore";
import { transformCampaignData } from "../utils/campaignTransforms";

export const CampaignProgress: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get("jobId");

  // Use the job progress hook for real-time updates
  const { progress: jobProgress } = useJobProgress(jobId || "");

  const campaigns = useCampaignStore((state) => state.campaigns);
  const addCampaign = useCampaignStore((state) => state.addCampaign);
  const updateCampaign = useCampaignStore((state) => state.updateCampaign);
  const setCurrentCampaign = useCampaignStore(
    (state) => state.setCurrentCampaign
  );
  const clearLeads = useCampaignStore((state) => state.clearLeads);
  const addLeads = useCampaignStore((state) => state.addLeads);
  const setLoading = useCampaignStore((state) => state.setLoading);
  const setError = useCampaignStore((state) => state.setError);
  const { user, sessionUserId } = useAuth();
  const authUserId = user?.id ?? null;

  const [isFetchingResults, setIsFetchingResults] = useState(false);
  const [resultFetchError, setResultFetchError] = useState<string | null>(null);
  const hasFetchedResultsRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Extract data from job progress
  const progress = jobProgress?.progress || 0;
  const status = jobProgress?.status || "pending";
  const currentStage = jobProgress?.currentStage || "Initializing...";
  const metrics = jobProgress?.metrics;
  const isComplete = status === "completed";
  const error = jobProgress?.error;

  const displayStage = isFetchingResults
    ? "Preparing final results..."
    : currentStage;
  const displayProgress = isFetchingResults
    ? Math.min(100, Math.max(progress, 96))
    : progress;
  const isProcessing = !isComplete || isFetchingResults;

  const fetchResults = useCallback(async () => {
    if (!campaignId) {
      return;
    }

    if (!authUserId && !sessionUserId) {
      setResultFetchError(
        "Missing session context. Refresh the page and try again."
      );
      return;
    }

    hasFetchedResultsRef.current = true;
    setIsFetchingResults(true);
    setResultFetchError(null);
    setLoading(true);

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      });

    try {
      const MAX_ATTEMPTS = 5;
      let campaignRecord: any = null;
      let leadsRecords: any[] = [];

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        let campaignQuery = supabase
          .from("campaigns")
          .select(
            "id,business_type,location,status,total_cost,results_count,created_at,updated_at"
          )
          .eq("id", campaignId);

        if (authUserId && sessionUserId) {
          campaignQuery = campaignQuery.or(
            `user_id.eq.${authUserId},session_user_id.eq.${sessionUserId}`
          );
        } else if (authUserId) {
          campaignQuery = campaignQuery.eq("user_id", authUserId);
        } else if (sessionUserId) {
          campaignQuery = campaignQuery.eq("session_user_id", sessionUserId);
        }

        const { data: campaignData, error: campaignError } =
          await campaignQuery.maybeSingle();

        if (campaignError) {
          throw campaignError;
        }

        let leadsQuery = supabase
          .from("leads")
          .select(
            "id,campaign_id,business_name,address,phone,website,email,confidence_score,validation_cost,enrichment_data,created_at"
          )
          .eq("campaign_id", campaignId)
          .order("confidence_score", { ascending: false });

        if (authUserId && sessionUserId) {
          leadsQuery = leadsQuery.or(
            `user_id.eq.${authUserId},session_user_id.eq.${sessionUserId}`
          );
        } else if (authUserId) {
          leadsQuery = leadsQuery.eq("user_id", authUserId);
        } else if (sessionUserId) {
          leadsQuery = leadsQuery.eq("session_user_id", sessionUserId);
        }

        const { data: leadsData, error: leadsError } = await leadsQuery;

        if (leadsError) {
          throw leadsError;
        }

        campaignRecord = campaignData;
        leadsRecords = leadsData ?? [];

        if (
          campaignRecord &&
          (leadsRecords.length > 0 || attempt === MAX_ATTEMPTS - 1)
        ) {
          break;
        }

        await wait(2000);
      }

      if (!campaignRecord) {
        throw new Error(
          "Campaign record not available yet. Please try again in a moment."
        );
      }

      const { campaignResult, leads: mappedLeads } = transformCampaignData(
        campaignRecord,
        leadsRecords,
        { metrics: (metrics ?? null) as Record<string, any> | null }
      );

      const campaignExists = campaigns.some(
        (item) => item.campaign_id === campaignResult.campaign_id
      );

      if (campaignExists) {
        updateCampaign(campaignResult.campaign_id, campaignResult);
      } else {
        addCampaign(campaignResult);
      }

      clearLeads();
      addLeads(mappedLeads);
      setCurrentCampaign(campaignResult);

      if (isMountedRef.current) {
        setResultFetchError(null);
        navigate("/results", { replace: true, state: { campaignId } });
      }
    } catch (err) {
      console.error("⚠️ Unable to load campaign results", err);
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load campaign results. Please try again.";

      if (isMountedRef.current) {
        setResultFetchError(message);
      }

      setError(message);
      hasFetchedResultsRef.current = false;
    } finally {
      if (isMountedRef.current) {
        setIsFetchingResults(false);
        setLoading(false);
      }
    }
  }, [
    addCampaign,
    addLeads,
    authUserId,
    campaignId,
    campaigns,
    clearLeads,
    metrics,
    navigate,
    sessionUserId,
    setCurrentCampaign,
    setError,
    setLoading,
    updateCampaign,
  ]);

  useEffect(() => {
    if (!isComplete || !campaignId || !jobId) {
      return;
    }

    if (!authUserId && !sessionUserId) {
      return;
    }

    if (hasFetchedResultsRef.current) {
      return;
    }

    fetchResults();
  }, [authUserId, campaignId, fetchResults, isComplete, jobId, sessionUserId]);

  const handleRetryFetch = () => {
    if (!campaignId) {
      return;
    }

    if (!authUserId && !sessionUserId) {
      setResultFetchError(
        "Missing session context. Refresh the page to re-establish your session."
      );
      return;
    }

    fetchResults();
  };

  if (!jobId || !campaignId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Invalid Campaign
          </h1>
          <p className="text-gray-600 mb-4">
            Missing job or campaign information.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Processing Error
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start New Campaign
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Campaign Discovery in Progress
        </h1>
        <p className="text-gray-600">
          Campaign ID: <span className="font-mono text-sm">{campaignId}</span>
        </p>
        <p className="text-gray-600">
          Job ID: <span className="font-mono text-sm">{jobId}</span>
        </p>
      </div>

      {isFetchingResults && !resultFetchError && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          Finalizing campaign results and syncing verified leads to your
          vault...
        </div>
      )}

      {resultFetchError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="font-semibold">Unable to load campaign results</div>
          <p className="mt-1">{resultFetchError}</p>
          <button
            onClick={handleRetryFetch}
            className="mt-3 inline-flex items-center rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm transition hover:bg-red-100"
          >
            Retry syncing results
          </button>
        </div>
      )}

      {/* Progress Display */}
      <ProgressDisplay
        isDiscovering={isProcessing}
        progress={displayProgress}
        currentStage={displayStage}
        cacheStats={null} // Real-time updates don't include cache stats
      />

      {/* Real-time Metrics */}
      {metrics && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Live Discovery Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.total_found || 0}
              </div>
              <div className="text-sm text-gray-600">Total Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.qualified_leads || 0}
              </div>
              <div className="text-sm text-gray-600">Qualified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.avg_confidence ? `${metrics.avg_confidence}%` : "0%"}
              </div>
              <div className="text-sm text-gray-600">Avg Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                ${(metrics.total_cost || 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
          </div>
        </div>
      )}

      {/* Status Updates */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Status Updates</h4>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span className="text-gray-600">
              Campaign started at {new Date().toLocaleTimeString()}
            </span>
          </div>
          {displayStage && (
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-gray-900 font-medium">{displayStage}</span>
            </div>
          )}
          {isFetchingResults && (
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-purple-600 font-medium">
                Finalizing leads and preparing results...
              </span>
            </div>
          )}
          {status === "completed" && (
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span className="text-green-600 font-medium">
                ✅ Discovery completed! Redirecting to results...
              </span>
            </div>
          )}
          {resultFetchError && (
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
              <span className="text-red-600 font-medium">
                {resultFetchError}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 text-center space-x-4">
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
        >
          Start New Campaign
        </button>
        {!isProcessing && (
          <button
            onClick={() => navigate("/results", { state: { campaignId } })}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View Complete Results
          </button>
        )}
      </div>
    </div>
  );
};
