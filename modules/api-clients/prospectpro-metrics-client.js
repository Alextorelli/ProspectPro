/**
 * ProspectPro Metrics Collection Client
 * Real-time monitoring and analytics for dashboard integration
 */

const { createClient } = require('@supabase/supabase-js');

class ProspectProMetricsClient {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.defaultUserId = null;
  }

  /**
   * Initialize metrics client with user context
   */
  async initialize(userId = null) {
    this.defaultUserId = userId;
    return true;
  }

  /**
   * Track API call with comprehensive metrics
   */
  async trackAPICall(campaignId, service, endpoint, cost, success, responseTime, metadata = {}) {
    try {
      const apiMetrics = {
        campaign_id: campaignId,
        api_service: service,
        endpoint: endpoint,
        request_count: 1,
        cost_per_request: cost,
        total_cost: cost,
        success_count: success ? 1 : 0,
        error_count: success ? 0 : 1,
        avg_response_time_ms: responseTime,
        rate_limit_remaining: metadata.rateLimitRemaining || null,
        date: new Date().toISOString().split('T')[0],
        hour: new Date().getHours(),
        created_at: new Date().toISOString()
      };

      // Insert API cost tracking
      const { error: costError } = await this.supabase
        .from('api_cost_tracking')
        .insert(apiMetrics);

      if (costError) {
        console.error('API cost tracking error:', costError);
      }

      // Track campaign analytics
      await this.trackCampaignMetric(campaignId, 'api_call_cost', cost, 'cost', service);
      await this.trackCampaignMetric(campaignId, 'api_response_time', responseTime, 'performance', service);
      
      if (!success && metadata.errorMessage) {
        await this.trackCampaignMetric(campaignId, 'api_error', 1, 'usage', service, {
          error_message: metadata.errorMessage
        });
      }

      return true;
    } catch (error) {
      console.error('API call tracking failed:', error);
      return false;
    }
  }

  /**
   * Track individual campaign metrics
   */
  async trackCampaignMetric(campaignId, metricName, value, type, apiService = null, metadata = {}) {
    try {
      const metric = {
        campaign_id: campaignId,
        metric_name: metricName,
        metric_value: value,
        metric_type: type,
        api_service: apiService,
        timestamp: new Date().toISOString(),
        metadata: metadata
      };

      const { error } = await this.supabase
        .from('campaign_analytics')
        .insert(metric);

      if (error) {
        console.error('Campaign metric tracking error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Campaign metric tracking failed:', error);
      return false;
    }
  }

  /**
   * Update comprehensive campaign qualification metrics
   */
  async updateCampaignQualificationMetrics(campaignId) {
    try {
      // Get current campaign stats
      const { data: campaignStats, error: statsError } = await this.supabase
        .rpc('get_dashboard_realtime_metrics');

      if (statsError) {
        console.error('Failed to get campaign stats:', statsError);
        return false;
      }

      // Get lead counts
      const { data: leadCounts, error: leadsError } = await this.supabase
        .from('enhanced_leads')
        .select('confidence_score, total_cost')
        .eq('campaign_id', campaignId);

      if (leadsError) {
        console.error('Failed to get lead counts:', leadsError);
        return false;
      }

      const totalLeads = leadCounts.length;
      const qualifiedLeads = leadCounts.filter(lead => lead.confidence_score >= 80).length;
      const qualificationRate = totalLeads > 0 ? qualifiedLeads / totalLeads : 0;
      const avgConfidence = totalLeads > 0 ? 
        leadCounts.reduce((sum, lead) => sum + lead.confidence_score, 0) / totalLeads : 0;
      
      // Get today's API costs
      const { data: todayCosts, error: costsError } = await this.supabase
        .from('api_cost_tracking')
        .select('total_cost, request_count')
        .eq('campaign_id', campaignId)
        .eq('date', new Date().toISOString().split('T')[0]);

      if (costsError) {
        console.error('Failed to get today costs:', costsError);
        return false;
      }

      const totalApiCost = todayCosts.reduce((sum, cost) => sum + parseFloat(cost.total_cost || 0), 0);
      const totalApiCalls = todayCosts.reduce((sum, cost) => sum + (cost.request_count || 0), 0);
      const costPerQualifiedLead = qualifiedLeads > 0 ? totalApiCost / qualifiedLeads : 0;
      
      // Calculate ROI (assuming $10 value per qualified lead)
      const roiPercentage = totalApiCost > 0 ? 
        ((qualifiedLeads * 10.00 - totalApiCost) / totalApiCost) * 100 : 0;

      // Insert qualification metrics
      const qualificationMetrics = {
        campaign_id: campaignId,
        total_leads_discovered: totalLeads,
        leads_qualified: qualifiedLeads,
        qualification_rate: qualificationRate,
        avg_confidence_score: avgConfidence,
        total_api_calls: totalApiCalls,
        total_api_cost: totalApiCost,
        cost_per_qualified_lead: costPerQualifiedLead,
        roi_percentage: roiPercentage,
        date: new Date().toISOString().split('T')[0],
        hour: new Date().getHours(),
        created_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('lead_qualification_metrics')
        .insert(qualificationMetrics);

      if (error) {
        console.error('Campaign qualification metrics error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Campaign qualification metrics update failed:', error);
      return false;
    }
  }

  /**
   * Update service health status for dashboard monitoring
   */
  async updateServiceHealth(serviceName, status, responseTime, errorRate, rateLimitRemaining, budgetRemaining) {
    try {
      // Get today's service usage
      const { data: todayUsage, error: usageError } = await this.supabase
        .from('api_cost_tracking')
        .select('total_cost, request_count')
        .eq('api_service', serviceName)
        .eq('date', new Date().toISOString().split('T')[0]);

      if (usageError) {
        console.error('Failed to get today usage:', usageError);
        return false;
      }

      const requestsToday = todayUsage.reduce((sum, usage) => sum + (usage.request_count || 0), 0);
      const costToday = todayUsage.reduce((sum, usage) => sum + parseFloat(usage.total_cost || 0), 0);

      const healthMetrics = {
        service_name: serviceName,
        status: status,
        response_time_ms: responseTime,
        error_rate: errorRate,
        rate_limit_remaining: rateLimitRemaining,
        cost_budget_remaining: budgetRemaining,
        requests_today: requestsToday,
        cost_today: costToday,
        last_successful_call: status === 'healthy' ? new Date().toISOString() : null,
        last_error: status !== 'healthy' ? `Service ${status} at ${new Date().toISOString()}` : null,
        timestamp: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('service_health_metrics')
        .insert(healthMetrics);

      if (error) {
        console.error('Service health update error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Service health update failed:', error);
      return false;
    }
  }

  /**
   * Get real-time dashboard metrics
   */
  async getDashboardMetrics() {
    try {
      const { data, error } = await this.supabase
        .rpc('get_dashboard_realtime_metrics');

      if (error) {
        console.error('Dashboard metrics fetch error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Dashboard metrics fetch failed:', error);
      return null;
    }
  }

  /**
   * Get cost per qualified lead analytics
   */
  async getCostAnalytics(campaignId = null, startDate = null, endDate = null) {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      const { data, error } = await this.supabase
        .rpc('calculate_cost_per_qualified_lead_dashboard', {
          campaign_id_param: campaignId,
          start_date: start,
          end_date: end
        });

      if (error) {
        console.error('Cost analytics fetch error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Cost analytics fetch failed:', error);
      return null;
    }
  }

  /**
   * Get API service breakdown for dashboard
   */
  async getAPIServiceBreakdown(startDate = null, endDate = null) {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      const { data, error } = await this.supabase
        .rpc('get_api_service_breakdown', {
          start_date: start,
          end_date: end
        });

      if (error) {
        console.error('API service breakdown fetch error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('API service breakdown fetch failed:', error);
      return null;
    }
  }

  /**
   * Prepare dashboard export data
   */
  async prepareDashboardExport(exportType, startDate, endDate, campaignIds = null) {
    try {
      const { data, error } = await this.supabase
        .rpc('prepare_dashboard_export_data', {
          export_type: exportType,
          start_date: startDate,
          end_date: endDate,
          campaign_ids: campaignIds
        });

      if (error) {
        console.error('Dashboard export preparation error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Dashboard export preparation failed:', error);
      return null;
    }
  }

  /**
   * Log dashboard export for tracking
   */
  async logDashboardExport(userId, exportType, fileFormat, startDate, endDate, campaignIds, rowCount, fileSizeMb) {
    try {
      const exportLog = {
        user_id: userId,
        export_type: exportType,
        file_format: fileFormat,
        start_date: startDate,
        end_date: endDate,
        campaign_ids: campaignIds,
        row_count: rowCount,
        file_size_mb: fileSizeMb,
        export_status: 'completed',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('dashboard_exports')
        .insert(exportLog)
        .select();

      if (error) {
        console.error('Dashboard export logging error:', error);
        return null;
      }

      return data[0];
    } catch (error) {
      console.error('Dashboard export logging failed:', error);
      return null;
    }
  }

  /**
   * Setup real-time subscriptions for dashboard
   */
  setupRealTimeSubscriptions(callback) {
    // Subscribe to service health updates
    const serviceHealthSubscription = this.supabase
      .channel('service-health-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'service_health_metrics' },
        (payload) => callback('service_health', payload.new)
      )
      .subscribe();

    // Subscribe to campaign qualification updates
    const qualificationSubscription = this.supabase
      .channel('qualification-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'lead_qualification_metrics' },
        (payload) => callback('qualification_metrics', payload.new)
      )
      .subscribe();

    // Subscribe to API cost updates
    const costSubscription = this.supabase
      .channel('cost-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'api_cost_tracking' },
        (payload) => callback('cost_tracking', payload.new)
      )
      .subscribe();

    return {
      serviceHealth: serviceHealthSubscription,
      qualification: qualificationSubscription,
      cost: costSubscription
    };
  }

  /**
   * Enhanced lead tracking for dashboard metrics
   */
  async trackLeadDiscovery(campaignId, leadData, apiCosts) {
    try {
      // Track the lead discovery costs
      for (const [apiService, cost] of Object.entries(apiCosts)) {
        await this.trackAPICall(
          campaignId,
          apiService,
          'lead_discovery',
          cost.amount,
          cost.success,
          cost.responseTime,
          { lead_id: leadData.id, ...cost.metadata }
        );
      }

      // Track lead quality metrics
      await this.trackCampaignMetric(
        campaignId,
        'lead_confidence_score',
        leadData.confidence_score,
        'quality',
        'system',
        { lead_id: leadData.id }
      );

      // Update campaign qualification metrics
      await this.updateCampaignQualificationMetrics(campaignId);

      return true;
    } catch (error) {
      console.error('Lead discovery tracking failed:', error);
      return false;
    }
  }
}

module.exports = ProspectProMetricsClient;