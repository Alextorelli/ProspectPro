import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { supabase, EDGE_FUNCTIONS } from '../lib/supabase'
import { useCampaignStore } from '../stores/campaignStore'
import type { CampaignConfig, BusinessDiscoveryResponse, EdgeFunctionResponse } from '../types'

export const useBusinessDiscovery = () => {
  const { addCampaign, setCurrentCampaign, addLeads, setLoading, setError } = useCampaignStore()
  const [progress, setProgress] = useState(0)

  const discoveryMutation = useMutation({
    mutationFn: async (config: CampaignConfig): Promise<BusinessDiscoveryResponse> => {
      setLoading(true)
      setError(null)
      setProgress(0)

      try {
        // Get the current session for authentication
        const { data: { session } } = await supabase.auth.getSession()
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        // Add auth header if user is authenticated
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`
        }

        const response = await fetch(EDGE_FUNCTIONS.ENHANCED_BUSINESS_DISCOVERY, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            search_query: `${config.search_terms} in ${config.location}`,
            business_type: config.business_type,
            budget_limit: config.budget_limit,
            max_results: config.max_results,
            validation_config: {
              include_email_validation: config.include_email_validation,
              include_website_validation: config.include_website_validation,
              min_confidence_score: config.min_confidence_score,
            },
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Discovery failed: ${response.status} ${errorText}`)
        }

        const result: EdgeFunctionResponse<BusinessDiscoveryResponse> = await response.json()
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Discovery failed')
        }

        return result.data
      } catch (error) {
        console.error('Business discovery error:', error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    onSuccess: (data) => {
      // Create campaign record
      const campaign = {
        campaign_id: data.campaign_id,
        status: 'completed' as const,
        progress: 100,
        total_cost: data.total_cost,
        leads_found: data.total_found,
        leads_qualified: data.qualified_count,
        leads_validated: data.businesses.filter(b => b.validation_status === 'validated').length,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }

      addCampaign(campaign)
      setCurrentCampaign(campaign)
      addLeads(data.businesses)
      setProgress(100)
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Discovery failed')
      setProgress(0)
    },
  })

  return {
    startDiscovery: discoveryMutation.mutate,
    isDiscovering: discoveryMutation.isPending,
    progress,
    error: discoveryMutation.error,
  }
}