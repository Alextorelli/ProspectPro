import React from "react";

interface ProgressDisplayProps {
  isDiscovering: boolean;
  progress: number;
  currentStage?: string;
  cacheStats?: {
    cache_hits: number;
    cache_misses: number;
    cache_hit_ratio: number;
    cost_savings: number;
  } | null;
}

export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  isDiscovering,
  progress,
  currentStage,
  cacheStats,
}) => {
  if (!isDiscovering && !cacheStats) return null;

  return (
    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      {isDiscovering && (
        <>
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Progressive Enrichment in Progress
              </h3>
              <p className="text-sm text-blue-600">
                {currentStage || `${progress}% complete`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </>
      )}

      {/* Cache Performance Display */}
      {cacheStats && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            🚀 Cache Performance (90-Day Intelligent Caching)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-2 rounded">
              <div className="text-lg font-bold text-green-600">
                {cacheStats.cache_hit_ratio.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Hit Ratio</div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="text-lg font-bold text-blue-600">
                {cacheStats.cache_hits}
              </div>
              <div className="text-xs text-gray-600">Cache Hits</div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="text-lg font-bold text-yellow-600">
                {cacheStats.cache_misses}
              </div>
              <div className="text-xs text-gray-600">Cache Misses</div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="text-lg font-bold text-green-600">
                ${cacheStats.cost_savings.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600">Saved</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
