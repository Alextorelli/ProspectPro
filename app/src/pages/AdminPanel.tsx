import React from 'react'

export const AdminPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="mt-1 text-sm text-gray-500">
          System monitoring and API usage analytics
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* API Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">API Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Google Places API</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">ZeroBounce API</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">State Registry APIs</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Usage Quotas */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Quotas</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Google Places</span>
                <span className="text-gray-900">1,247 / 10,000</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '12.5%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Email Validation</span>
                <span className="text-gray-900">342 / 1,000</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '34.2%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Healthy
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Edge Functions</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                4/4 Active
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm text-gray-900">~2.3s avg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-400 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                Campaign completed successfully
              </p>
              <p className="text-sm text-gray-500">
                47 leads discovered, $12.34 total cost • 2 minutes ago
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-400 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                New campaign started
              </p>
              <p className="text-sm text-gray-500">
                Searching for restaurants in San Francisco • 5 minutes ago
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 mt-2 bg-yellow-400 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                API rate limit warning
              </p>
              <p className="text-sm text-gray-500">
                Google Places API approaching daily limit • 1 hour ago
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}