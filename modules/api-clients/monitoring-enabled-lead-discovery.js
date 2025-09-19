/**
 * Enhanced Integration with Dashboard Monitoring Example
 * Shows how to integrate metrics collection with lead discovery
 */

const EnhancedScrapingDogClient = require('./enhanced-scrapingdog-client');
const EnhancedHunterClient = require('./enhanced-hunter-client');
const EnhancedSupabaseClient = require('./enhanced-supabase-client');
const ProspectProMetricsClient = require('./prospectpro-metrics-client');
const LeadDiscoveryOrchestrator = require('../enhanced-lead-discovery-orchestrator');

class MonitoringEnabledLeadDiscovery {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.metricsClient = new ProspectProMetricsClient(supabaseClient);
    this.scrapingDogClient = new EnhancedScrapingDogClient();
    this.hunterClient = new EnhancedHunterClient();
    this.orchestrator = new LeadDiscoveryOrchestrator();
  }

  /**
   * Initialize monitoring-enabled lead discovery
   */
  async initialize(userId) {
    await this.metricsClient.initialize(userId);
    await this.orchestrator.initialize();
    
    console.log('🎯 Monitoring-enabled lead discovery initialized');
    return true;
  }

  /**
   * Enhanced lead discovery with comprehensive monitoring
   */
  async discoverLeadsWithMonitoring(campaignConfig) {
    const campaignId = campaignConfig.id;
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Starting monitored lead discovery for campaign: ${campaignId}`);
      
      // Track campaign start
      await this.metricsClient.trackCampaignMetric(
        campaignId, 
        'campaign_started', 
        1, 
        'usage', 
        'system'
      );

      // Step 1: Business Discovery with ScrapingDog (with monitoring)
      console.log('🔍 Phase 1: Business Discovery with monitoring...');
      const businesses = await this.discoverBusinessesWithMetrics(campaignId, campaignConfig);
      
      // Step 2: Email Enrichment with Hunter.io (with monitoring)
      console.log('📧 Phase 2: Email enrichment with monitoring...');
      const enrichedBusinesses = await this.enrichEmailsWithMetrics(campaignId, businesses);
      
      // Step 3: Final validation and quality scoring (with monitoring)
      console.log('✅ Phase 3: Quality validation with monitoring...');
      const qualifiedLeads = await this.validateLeadsWithMetrics(campaignId, enrichedBusinesses);
      
      // Step 4: Update comprehensive metrics
      await this.metricsClient.updateCampaignQualificationMetrics(campaignId);
      
      // Step 5: Update service health status
      await this.updateAllServiceHealth();
      
      const totalTime = Date.now() - startTime;
      
      // Track campaign completion
      await this.metricsClient.trackCampaignMetric(
        campaignId, 
        'campaign_completed', 
        totalTime, 
        'performance', 
        'system',
        {
          total_leads: qualifiedLeads.length,
          processing_time_ms: totalTime
        }
      );

      console.log(`🎉 Monitored lead discovery completed: ${qualifiedLeads.length} qualified leads in ${totalTime}ms`);
      
      return {
        campaign_id: campaignId,
        qualified_leads: qualifiedLeads,
        processing_time_ms: totalTime,
        monitoring_data: await this.metricsClient.getDashboardMetrics()
      };

    } catch (error) {
      console.error('❌ Monitored lead discovery failed:', error);
      
      // Track campaign failure
      await this.metricsClient.trackCampaignMetric(
        campaignId, 
        'campaign_failed', 
        1, 
        'usage', 
        'system',
        { error_message: error.message }
      );
      
      throw error;
    }
  }

  /**
   * Business discovery with metrics tracking
   */
  async discoverBusinessesWithMetrics(campaignId, config) {
    const startTime = Date.now();
    let totalCost = 0;
    let requestCount = 0;
    let successCount = 0;
    
    try {
      // Call ScrapingDog API
      const businesses = await this.scrapingDogClient.searchBusinessesMultiRadius(
        config.businessType,
        config.location,
        config.maxResults || 10
      );
      
      successCount = businesses.length;
      requestCount = 1; // Simplified for example
      totalCost = 0.02; // Example cost
      
      const responseTime = Date.now() - startTime;
      
      // Track API call
      await this.metricsClient.trackAPICall(
        campaignId,
        'scrapingdog',
        'multi_radius_search',
        totalCost,
        true,
        responseTime,
        {
          businesses_found: businesses.length,
          location: config.location,
          business_type: config.businessType
        }
      );

      console.log(`  ✅ Found ${businesses.length} businesses via ScrapingDog in ${responseTime}ms`);
      
      return businesses;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Track failed API call
      await this.metricsClient.trackAPICall(
        campaignId,
        'scrapingdog',
        'multi_radius_search',
        totalCost,
        false,
        responseTime,
        {
          error_message: error.message,
          location: config.location
        }
      );
      
      console.error(`  ❌ ScrapingDog discovery failed in ${responseTime}ms:`, error.message);
      throw error;
    }
  }

  /**
   * Email enrichment with metrics tracking
   */
  async enrichEmailsWithMetrics(campaignId, businesses) {
    const enrichedBusinesses = [];
    
    for (const business of businesses) {
      const startTime = Date.now();
      
      try {
        // Generate email patterns
        const emailPatterns = await this.hunterClient.generateEmailPatterns(
          { firstName: 'Contact', lastName: 'Manager' },
          business.website || business.business_name.replace(/\s+/g, '').toLowerCase() + '.com'
        );
        
        const responseTime = Date.now() - startTime;
        const cost = 0.01 * emailPatterns.length; // Example cost calculation
        
        // Track email discovery
        await this.metricsClient.trackAPICall(
          campaignId,
          'hunter_io',
          'email_pattern_generation',
          cost,
          emailPatterns.length > 0,
          responseTime,
          {
            business_id: business.id,
            patterns_generated: emailPatterns.length,
            domain: business.website
          }
        );

        // Enrich business with email data
        const enrichedBusiness = {
          ...business,
          email_patterns: emailPatterns,
          email_discovered: emailPatterns.length > 0,
          enrichment_cost: cost
        };
        
        enrichedBusinesses.push(enrichedBusiness);
        
        console.log(`  📧 Generated ${emailPatterns.length} email patterns for ${business.business_name}`);
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        // Track failed email enrichment
        await this.metricsClient.trackAPICall(
          campaignId,
          'hunter_io',
          'email_pattern_generation',
          0,
          false,
          responseTime,
          {
            business_id: business.id,
            error_message: error.message
          }
        );
        
        // Still include business without email
        enrichedBusinesses.push({
          ...business,
          email_patterns: [],
          email_discovered: false,
          enrichment_cost: 0,
          enrichment_error: error.message
        });
        
        console.error(`  ❌ Email enrichment failed for ${business.business_name}:`, error.message);
      }
    }
    
    return enrichedBusinesses;
  }

  /**
   * Lead validation with quality metrics tracking
   */
  async validateLeadsWithMetrics(campaignId, businesses) {
    const qualifiedLeads = [];
    
    for (const business of businesses) {
      // Calculate quality score
      let qualityScore = 0;
      
      // Business name quality (20 points)
      if (business.business_name && business.business_name.length > 0) {
        qualityScore += 20;
      }
      
      // Contact information (40 points)
      if (business.phone) qualityScore += 20;
      if (business.email_discovered) qualityScore += 20;
      
      // Address and location (20 points)  
      if (business.address) qualityScore += 20;
      
      // Website presence (20 points)
      if (business.website) qualityScore += 20;
      
      // Track quality score
      await this.metricsClient.trackCampaignMetric(
        campaignId,
        'lead_quality_score',
        qualityScore,
        'quality',
        'system',
        {
          business_id: business.id,
          business_name: business.business_name
        }
      );

      // Qualify leads with 80%+ score
      if (qualityScore >= 80) {
        const qualifiedLead = {
          ...business,
          confidence_score: qualityScore,
          qualified: true,
          qualification_timestamp: new Date().toISOString()
        };
        
        qualifiedLeads.push(qualifiedLead);
        
        // Track lead discovery with costs
        const totalCost = (business.enrichment_cost || 0) + 0.01; // Discovery + processing cost
        await this.metricsClient.trackLeadDiscovery(
          campaignId,
          qualifiedLead,
          {
            scrapingdog: {
              amount: 0.01,
              success: true,
              responseTime: 500,
              metadata: { source: 'google_maps' }
            },
            hunter_io: {
              amount: business.enrichment_cost || 0,
              success: business.email_discovered,
              responseTime: 800,
              metadata: { patterns: business.email_patterns?.length || 0 }
            }
          }
        );
        
        console.log(`  ✅ Qualified: ${business.business_name} (${qualityScore}% confidence)`);
      } else {
        console.log(`  ⚠️  Below threshold: ${business.business_name} (${qualityScore}% confidence)`);
      }
    }
    
    return qualifiedLeads;
  }

  /**
   * Update service health for all APIs
   */
  async updateAllServiceHealth() {
    // Update ScrapingDog health
    await this.metricsClient.updateServiceHealth(
      'scrapingdog',
      'healthy',
      450, // response time
      0.02, // 2% error rate
      8500, // rate limit remaining
      475.50 // budget remaining
    );
    
    // Update Hunter.io health  
    await this.metricsClient.updateServiceHealth(
      'hunter_io',
      'healthy',
      750,
      0.01,
      95, // requests remaining
      18.75
    );
    
    // Update Google Places health
    await this.metricsClient.updateServiceHealth(
      'google_places',
      'healthy',
      320,
      0.00,
      950,
      47.25
    );
  }

  /**
   * Get comprehensive campaign analytics for dashboard
   */
  async getCampaignAnalytics(campaignId, days = 30) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const [costAnalytics, apiBreakdown, dashboardMetrics] = await Promise.all([
      this.metricsClient.getCostAnalytics(campaignId, startDate, endDate),
      this.metricsClient.getAPIServiceBreakdown(startDate, endDate),
      this.metricsClient.getDashboardMetrics()
    ]);
    
    return {
      campaign_id: campaignId,
      period: `${startDate} to ${endDate}`,
      cost_analytics: costAnalytics,
      api_breakdown: apiBreakdown,
      real_time_metrics: dashboardMetrics,
      export_available: true
    };
  }

  /**
   * Setup real-time monitoring for dashboard
   */
  setupDashboardMonitoring(callback) {
    console.log('🔄 Setting up real-time dashboard monitoring...');
    
    const subscriptions = this.metricsClient.setupRealTimeSubscriptions((eventType, data) => {
      console.log(`📊 Dashboard event: ${eventType}`, data);
      
      // Forward to dashboard callback
      if (callback) {
        callback(eventType, data);
      }
    });
    
    console.log('✅ Real-time monitoring active');
    return subscriptions;
  }
}

// Usage Example
async function runMonitoredCampaign() {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const monitoredDiscovery = new MonitoringEnabledLeadDiscovery(supabaseClient);
  await monitoredDiscovery.initialize('user-123');
  
  // Setup real-time monitoring
  const subscriptions = monitoredDiscovery.setupDashboardMonitoring((eventType, data) => {
    console.log(`🎯 Dashboard update: ${eventType}`, data);
  });
  
  // Run monitored campaign
  const campaignConfig = {
    id: 'campaign-456',
    businessType: 'restaurants',
    location: 'Austin, TX',
    maxResults: 10
  };
  
  const results = await monitoredDiscovery.discoverLeadsWithMonitoring(campaignConfig);
  
  console.log('🎉 Campaign completed with monitoring:', {
    qualified_leads: results.qualified_leads.length,
    processing_time: results.processing_time_ms + 'ms',
    dashboard_ready: true
  });
  
  // Get analytics for dashboard
  const analytics = await monitoredDiscovery.getCampaignAnalytics(campaignConfig.id);
  console.log('📊 Campaign analytics ready for dashboard:', analytics);
}

module.exports = {
  MonitoringEnabledLeadDiscovery,
  runMonitoredCampaign
};

// Run example if called directly
if (require.main === module) {
  runMonitoredCampaign().catch(console.error);
}