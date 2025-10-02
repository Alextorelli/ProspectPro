import React, { useState } from 'react'
import { useBusinessDiscovery } from '../hooks/useBusinessDiscovery'
import type { CampaignConfig } from '../types'

export const BusinessDiscovery: React.FC = () => {
  const { startDiscovery, isDiscovering, progress } = useBusinessDiscovery()
  
  const [config, setConfig] = useState<CampaignConfig>({
    search_terms: '',
    location: '',
    business_type: '',
    budget_limit: 25,
    max_results: 50,
    include_email_validation: true,
    include_website_validation: true,
    min_confidence_score: 70,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!config.search_terms || !config.location) {
      alert('Please fill in search terms and location')
      return
    }
    startDiscovery(config)
  }

  const handleInputChange = (field: keyof CampaignConfig, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Discovery</h1>
        <p className="mt-1 text-sm text-gray-500">
          Find and validate real business leads with our zero fake data guarantee
        </p>
      </div>

      {/* Discovery Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Search Configuration */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="search_terms" className="block text-sm font-medium text-gray-700">
                Search Terms *
              </label>
              <input
                type="text"
                id="search_terms"
                value={config.search_terms}
                onChange={(e) => handleInputChange('search_terms', e.target.value)}
                placeholder="e.g., restaurants, dental offices, law firms"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location *
              </label>
              <input
                type="text"
                id="location"
                value={config.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., San Francisco, CA"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="business_type" className="block text-sm font-medium text-gray-700">
                Business Type (Optional)
              </label>
              <input
                type="text"
                id="business_type"
                value={config.business_type}
                onChange={(e) => handleInputChange('business_type', e.target.value)}
                placeholder="e.g., restaurant, medical_office"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="max_results" className="block text-sm font-medium text-gray-700">
                Max Results
              </label>
              <input
                type="number"
                id="max_results"
                value={config.max_results}
                onChange={(e) => handleInputChange('max_results', parseInt(e.target.value))}
                min={10}
                max={500}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Budget and Quality Controls */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Budget & Quality Controls</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="budget_limit" className="block text-sm font-medium text-gray-700">
                  Budget Limit ($)
                </label>
                <input
                  type="number"
                  id="budget_limit"
                  value={config.budget_limit}
                  onChange={(e) => handleInputChange('budget_limit', parseFloat(e.target.value))}
                  min={5}
                  max={1000}
                  step={5}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="min_confidence" className="block text-sm font-medium text-gray-700">
                  Min Confidence Score (%)
                </label>
                <input
                  type="number"
                  id="min_confidence"
                  value={config.min_confidence_score}
                  onChange={(e) => handleInputChange('min_confidence_score', parseInt(e.target.value))}
                  min={50}
                  max={100}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Validation Options */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Validation Options</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="email_validation"
                  type="checkbox"
                  checked={config.include_email_validation}
                  onChange={(e) => handleInputChange('include_email_validation', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="email_validation" className="ml-2 block text-sm text-gray-900">
                  Include Email Validation (+$0.008 per email)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="website_validation"
                  type="checkbox"
                  checked={config.include_website_validation}
                  onChange={(e) => handleInputChange('include_website_validation', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="website_validation" className="ml-2 block text-sm text-gray-900">
                  Include Website Validation (Free)
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isDiscovering}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDiscovering ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Discovering ({progress}%)
                </>
              ) : (
                'Start Discovery'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Progress Indicator */}
      {isDiscovering && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Discovery Progress</h3>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Finding and validating real business data... {progress}% complete
          </p>
        </div>
      )}
    </div>
  )
}