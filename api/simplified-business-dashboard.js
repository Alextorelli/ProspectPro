/**
 * Simplified Business Analytics Dashboard
 * Leverages Railway's built-in monitoring for infrastructure
 * Focuses only on ProspectPro-specific business metrics
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

class BusinessAnalyticsDashboard {
  constructor() {
    // Initialize Supabase client if available
    this.supabase = null;
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
    }
  }

  /**
   * Get business-specific metrics (not covered by Railway analytics)
   */
  async getBusinessMetrics() {
    if (!this.supabase) {
      return this.getMockBusinessMetrics();
    }

    try {
      // Only business-specific queries, not infrastructure metrics
      const [campaigns, businesses, apiUsage] = await Promise.all([
        this.supabase.from('campaigns').select('*', { count: 'exact' }),
        this.supabase.from('businesses').select('*', { count: 'exact' }),
        this.supabase.from('api_usage').select('*').limit(100)
      ]);

      return {
        campaigns: {
          total: campaigns.count || 0,
          active: campaigns.data?.filter(c => c.status === 'active').length || 0,
          success_rate: this.calculateCampaignSuccessRate(campaigns.data || [])
        },
        leads: {
          total: businesses.count || 0,
          qualified: businesses.data?.filter(b => b.is_qualified).length || 0,
          qualification_rate: this.calculateQualificationRate(businesses.data || [])
        },
        costs: this.calculateApiCosts(apiUsage.data || []),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching business metrics:', error);
      return this.getMockBusinessMetrics();
    }
  }

  /**
   * Calculate campaign success rates (business logic)
   */
  calculateCampaignSuccessRate(campaigns) {
    if (!campaigns.length) return 100;
    const successful = campaigns.filter(c => c.leads_found > 0).length;
    return Math.round((successful / campaigns.length) * 100);
  }

  /**
   * Calculate lead qualification rates (business logic)
   */
  calculateQualificationRate(businesses) {
    if (!businesses.length) return 100;
    const qualified = businesses.filter(b => b.confidence_score >= 80).length;
    return Math.round((qualified / businesses.length) * 100);
  }

  /**
   * Calculate API costs (business-specific)
   */
  calculateApiCosts(apiUsage) {
    const costs = {
      google_places: 0,
      scrapingdog: 0,
      hunter_io: 0,
      neverbounce: 0,
      total: 0
    };

    apiUsage.forEach(usage => {
      switch (usage.api_name) {
        case 'google_places':
          costs.google_places += (usage.requests_count * 0.032);
          break;
        case 'scrapingdog':
          costs.scrapingdog += (usage.requests_count * 0.0008);
          break;
        case 'hunter_io':
          costs.hunter_io += (usage.requests_count * 0.098);
          break;
        case 'neverbounce':
          costs.neverbounce += (usage.requests_count * 0.01);
          break;
      }
    });

    costs.total = Object.values(costs).reduce((sum, cost) => sum + cost, 0) - costs.total;
    return costs;
  }

  /**
   * Mock data for when Supabase is unavailable
   */
  getMockBusinessMetrics() {
    return {
      campaigns: { total: 0, active: 0, success_rate: 100 },
      leads: { total: 0, qualified: 0, qualification_rate: 100 },
      costs: { total: 0, google_places: 0, scrapingdog: 0, hunter_io: 0, neverbounce: 0 },
      timestamp: new Date().toISOString(),
      note: 'Mock data - database connection unavailable'
    };
  }
}

/**
 * Create simplified dashboard routes
 */
function createSimplifiedDashboardRoutes() {
  const router = express.Router();
  const dashboard = new BusinessAnalyticsDashboard();

  // Business metrics endpoint (only what Railway doesn't provide)
  router.get('/api/business-metrics', async (req, res) => {
    try {
      const metrics = await dashboard.getBusinessMetrics();
      res.json({
        success: true,
        data: metrics,
        message: 'Use Railway dashboard for infrastructure metrics'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Check Railway logs and metrics dashboard'
      });
    }
  });

  // Health check (basic business health)
  router.get('/api/business-health', async (req, res) => {
    const metrics = await dashboard.getBusinessMetrics();
    const isHealthy = metrics.campaigns.success_rate > 50 && metrics.leads.qualification_rate > 60;
    
    res.json({
      healthy: isHealthy,
      business_metrics: {
        campaign_success: metrics.campaigns.success_rate,
        lead_qualification: metrics.leads.qualification_rate,
        daily_cost: metrics.costs.total
      },
      infrastructure_note: 'Check Railway dashboard for server health'
    });
  });

  return router;
}

module.exports = {
  createSimplifiedDashboardRoutes,
  BusinessAnalyticsDashboard
};