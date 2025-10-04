import React, { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ProgressDisplay } from "../components/ProgressDisplay";
import { useJobProgress } from "../hooks/useJobProgress";

export const CampaignProgress: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get("jobId");

  // Use the job progress hook for real-time updates
  const { progress: jobProgress } = useJobProgress(jobId || "");

  // Extract data from job progress
  const progress = jobProgress?.progress || 0;
  const status = jobProgress?.status || "pending";
  const currentStage = jobProgress?.currentStage || "Initializing...";
  const metrics = jobProgress?.metrics;
  const isComplete = status === "completed";
  const error = jobProgress?.error;

  // Navigate to results when complete
  useEffect(() => {
    if (isComplete && campaignId) {
      // Small delay to show completion state
      setTimeout(() => {
        navigate(`/campaign/${campaignId}/results`);
      }, 2000);
    }
  }, [isComplete, campaignId, navigate]);

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

      {/* Progress Display */}
      <ProgressDisplay
        isDiscovering={!isComplete}
        progress={progress}
        currentStage={currentStage}
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
          {currentStage && (
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-gray-900 font-medium">{currentStage}</span>
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
        {isComplete && (
          <button
            onClick={() => navigate(`/campaign/${campaignId}/results`)}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View Complete Results
          </button>
        )}
      </div>
    </div>
  );
};
