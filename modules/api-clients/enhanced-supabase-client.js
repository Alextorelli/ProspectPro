/**
 * Enhanced Supabase Integration - Advanced Database Architecture
 * Real-time lead management with comprehensive analytics and multi-tenant security
 */

const { createClient } = require('@supabase/supabase-js');

class EnhancedSupabaseClient {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'public' },
      auth: { autoRefreshToken: true, persistSession: true },
      global: { headers: { 'x-client': 'ProspectPro-Enhanced' } }
    });
    
    this.realTimeChannels = new Map();
    this.subscriptions = new Map();
  }

  /**
   * Enhanced lead creation with full metadata and quality scoring
   * @param {Object} leadData - Complete lead information
   * @param {string} campaignId - Campaign UUID
   * @returns {Promise<Object>} Created lead with ID
   */
  async createEnhancedLead(leadData, campaignId) {
    console.log(`💾 Creating enhanced lead: ${leadData.business_name}`);
    
    try {
      // Calculate comprehensive scores
      const enhancedLead = {
        ...leadData,
        campaign_id: campaignId,
        
        // Quality scores
        confidence_score: this.calculateConfidenceScore(leadData),
        data_completeness_score: this.calculateCompletenessScore(leadData),
        
        // Cost tracking
        discovery_cost: leadData.discovery_cost || 0,
        enrichment_cost: leadData.enrichment_cost || 0,
        
        // Source attribution
        discovery_source: leadData.source || 'manual',
        enrichment_sources: {
          scrapingdog: Boolean(leadData.website_content),
          hunter_io: Boolean(leadData.emails?.length),
          government_registry: Boolean(leadData.registry_verified),
          social_media: Boolean(leadData.social_links && Object.keys(leadData.social_links).length)
        },
        
        // Validation status
        email_verified: leadData.emails?.some(e => e.verification_status === 'deliverable') || false,
        website_status: leadData.website_status || null,
        social_verified: Boolean(leadData.social_links && Object.keys(leadData.social_links).length),
        
        // Search metadata
        search_query: leadData.search_query || null,
        location_coordinates: leadData.coordinates ? `POINT(${leadData.coordinates.lng} ${leadData.coordinates.lat})` : null,
        search_radius_km: leadData.search_radius_km || null,
        
        // Rich metadata
        metadata: {
          review_sentiment: leadData.review_sentiment,
          business_type: leadData.business_type || leadData.types,
          employee_count: leadData.employee_count,
          discovery_timestamp: new Date().toISOString(),
          api_sources: leadData.api_sources || [],
          enrichment_timestamp: leadData.enrichment_timestamp
        }
      };

      // Insert main lead record
      const { data: lead, error: leadError } = await this.supabase
        .from('enhanced_leads')
        .insert(enhancedLead)
        .select('*')
        .single();

      if (leadError) {
        console.error('❌ Lead creation error:', leadError);
        throw leadError;
      }

      console.log(`✅ Lead created with ID: ${lead.id}`);

      // Insert related email records
      if (leadData.emails && leadData.emails.length > 0) {
        await this.createLeadEmails(lead.id, leadData.emails);
      }

      // Insert social media profiles
      if (leadData.social_links && Object.keys(leadData.social_links).length > 0) {
        await this.createSocialProfiles(lead.id, leadData.social_links);
      }

      // Update campaign statistics
      await this.updateCampaignStats(campaignId, lead);

      return lead;

    } catch (error) {
      console.error(`❌ Enhanced lead creation failed for ${leadData.business_name}:`, error);
      throw error;
    }
  }

  /**
   * Create email records for a lead
   * @param {string} leadId - Lead UUID
   * @param {Array} emails - Email objects
   */
  async createLeadEmails(leadId, emails) {
    const emailRecords = emails.map(email => ({
      lead_id: leadId,
      email: email.value || email.email || email,
      source: email.source || email.type || 'unknown',
      verification_status: email.verification_status || 'unknown',
      verification_score: email.verification_score || email.confidence || 0,
      discovery_cost: email.discovery_cost || 0,
      verified_at: email.verified_at || null
    }));

    const { error } = await this.supabase
      .from('lead_emails')
      .insert(emailRecords);

    if (error) {
      console.error('❌ Email creation error:', error);
    } else {
      console.log(`📧 Created ${emailRecords.length} email records`);
    }
  }

  /**
   * Create social media profile records
   * @param {string} leadId - Lead UUID
   * @param {Object} socialLinks - Social media links
   */
  async createSocialProfiles(leadId, socialLinks) {
    const profileRecords = Object.entries(socialLinks).map(([platform, url]) => ({
      lead_id: leadId,
      platform: platform,
      profile_url: url,
      username: this.extractUsernameFromUrl(url),
      verification_status: 'pending'
    }));

    const { error } = await this.supabase
      .from('lead_social_profiles')
      .insert(profileRecords);

    if (error) {
      console.error('❌ Social profiles creation error:', error);
    } else {
      console.log(`🔗 Created ${profileRecords.length} social profile records`);
    }
  }

  /**
   * Advanced lead filtering with PostgREST capabilities
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered leads
   */
  async getQualifiedLeads(filters = {}) {
    console.log('🔍 Fetching qualified leads with filters:', filters);
    
    let query = this.supabase
      .from('enhanced_leads')
      .select(`
        *,
        lead_emails(*),
        lead_social_profiles(*),
        campaigns(name, created_at, user_id)
      `);

    // Apply filters
    if (filters.minConfidence) {
      query = query.gte('confidence_score', filters.minConfidence);
    }

    if (filters.hasEmail) {
      query = query.not('lead_emails', 'is', null);
    }

    if (filters.maxCost) {
      query = query.lte('total_cost', filters.maxCost);
    }

    if (filters.businessTypes && filters.businessTypes.length > 0) {
      query = query.overlaps('metadata->business_type', filters.businessTypes);
    }

    if (filters.campaignIds && filters.campaignIds.length > 0) {
      query = query.in('campaign_id', filters.campaignIds);
    }

    if (filters.dateRange) {
      if (filters.dateRange.start) {
        query = query.gte('created_at', filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        query = query.lte('created_at', filters.dateRange.end);
      }
    }

    // Geographic filtering
    if (filters.location && filters.radiusKm) {
      query = query.rpc('leads_within_radius', {
        center_lat: filters.location.lat,
        center_lng: filters.location.lng,
        radius_km: filters.radiusKm
      });
    }

    // Sorting and pagination
    const sortField = filters.sortBy || 'confidence_score';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Lead query error:', error);
      throw error;
    }

    console.log(`✅ Found ${data.length} qualified leads`);
    return data;
  }

  /**
   * Create a new campaign with budget and quality settings
   * @param {Object} campaignData - Campaign configuration
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Created campaign
   */
  async createCampaign(campaignData, userId) {
    console.log(`🚀 Creating campaign: ${campaignData.name}`);
    
    const campaign = {
      user_id: userId,
      name: campaignData.name,
      search_parameters: campaignData.search_parameters,
      budget_limit: campaignData.budget_limit || 100,
      lead_limit: campaignData.lead_limit || 1000,
      quality_threshold: campaignData.quality_threshold || 70,
      status: 'running'
    };

    const { data, error } = await this.supabase
      .from('campaigns')
      .insert(campaign)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Campaign creation error:', error);
      throw error;
    }

    console.log(`✅ Campaign created with ID: ${data.id}`);
    return data;
  }

  /**
   * Update campaign statistics
   * @param {string} campaignId - Campaign UUID
   * @param {Object} newLead - Lead that was just added
   */
  async updateCampaignStats(campaignId, newLead) {
    try {
      // Get current stats
      const { data: campaign, error: fetchError } = await this.supabase
        .from('campaigns')
        .select('leads_discovered, leads_qualified, total_cost')
        .eq('id', campaignId)
        .single();

      if (fetchError) {
        console.error('❌ Campaign fetch error:', fetchError);
        return;
      }

      // Calculate updates
      const updates = {
        leads_discovered: (campaign.leads_discovered || 0) + 1,
        leads_qualified: (campaign.leads_qualified || 0) + (newLead.confidence_score >= 70 ? 1 : 0),
        total_cost: Number((campaign.total_cost || 0) + (newLead.total_cost || 0)).toFixed(4)
      };

      // Update campaign
      const { error: updateError } = await this.supabase
        .from('campaigns')
        .update(updates)
        .eq('id', campaignId);

      if (updateError) {
        console.error('❌ Campaign stats update error:', updateError);
      }

    } catch (error) {
      console.error(`❌ Campaign stats update failed:`, error);
    }
  }

  /**
   * Log API usage for cost tracking and analytics
   * @param {Object} usageData - API usage information
   */
  async logApiUsage(usageData) {
    const logEntry = {
      campaign_id: usageData.campaign_id,
      api_service: usageData.api_service,
      endpoint: usageData.endpoint,
      request_cost: usageData.request_cost || 0,
      response_status: usageData.response_status,
      credits_used: usageData.credits_used || 1,
      processing_time_ms: usageData.processing_time_ms || 0
    };

    const { error } = await this.supabase
      .from('api_usage_log')
      .insert(logEntry);

    if (error) {
      console.error('❌ API usage logging error:', error);
    }
  }

  /**
   * Get comprehensive campaign analytics
   * @param {string} campaignId - Campaign UUID
   * @returns {Promise<Object>} Analytics data
   */
  async getCampaignAnalytics(campaignId) {
    console.log(`📊 Fetching analytics for campaign: ${campaignId}`);
    
    try {
      const { data, error } = await this.supabase.rpc('campaign_analytics', {
        campaign_id: campaignId
      });

      if (error) {
        console.error('❌ Campaign analytics error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Campaign analytics failed:', error);
      
      // Fallback to basic analytics query
      return await this.getBasicCampaignStats(campaignId);
    }
  }

  /**
   * Fallback method for basic campaign statistics
   * @param {string} campaignId - Campaign UUID
   * @returns {Promise<Object>} Basic stats
   */
  async getBasicCampaignStats(campaignId) {
    const { data: campaign, error: campaignError } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    const { data: leads, error: leadsError } = await this.supabase
      .from('enhanced_leads')
      .select('confidence_score, total_cost')
      .eq('campaign_id', campaignId);

    if (campaignError || leadsError) {
      throw new Error('Failed to fetch basic campaign stats');
    }

    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(l => l.confidence_score >= campaign.quality_threshold).length;
    const totalCost = leads.reduce((sum, l) => sum + (l.total_cost || 0), 0);

    return {
      campaign_id: campaignId,
      campaign_name: campaign.name,
      total_leads: totalLeads,
      qualified_leads: qualifiedLeads,
      total_cost: totalCost,
      average_confidence: totalLeads > 0 ? 
        Math.round(leads.reduce((sum, l) => sum + l.confidence_score, 0) / totalLeads) : 0,
      cost_per_lead: totalLeads > 0 ? (totalCost / totalLeads).toFixed(4) : 0,
      cost_per_qualified_lead: qualifiedLeads > 0 ? (totalCost / qualifiedLeads).toFixed(4) : 0
    };
  }

  /**
   * Real-time campaign monitoring setup
   * @param {string} campaignId - Campaign to monitor
   * @param {Object} callbacks - Event handlers
   * @returns {Object} Subscription channel
   */
  setupCampaignMonitoring(campaignId, callbacks = {}) {
    console.log(`📡 Setting up real-time monitoring for campaign: ${campaignId}`);
    
    const channelName = `campaign_${campaignId}`;
    
    const channel = this.supabase
      .channel(channelName)
      
      // New leads discovered
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'enhanced_leads',
        filter: `campaign_id=eq.${campaignId}`
      }, (payload) => {
        console.log('📈 New lead discovered:', payload.new.business_name);
        if (callbacks.onNewLead) {
          callbacks.onNewLead(payload.new);
        }
      })
      
      // Campaign updates
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'campaigns',
        filter: `id=eq.${campaignId}`
      }, (payload) => {
        console.log('📊 Campaign updated:', payload.new);
        if (callbacks.onCampaignUpdate) {
          callbacks.onCampaignUpdate(payload.new);
        }
      })
      
      .subscribe((status) => {
        console.log(`📡 Real-time subscription status: ${status}`);
        if (callbacks.onStatusChange) {
          callbacks.onStatusChange(status);
        }
      });

    this.realTimeChannels.set(campaignId, channel);
    return channel;
  }

  /**
   * Stop real-time monitoring for a campaign
   * @param {string} campaignId - Campaign ID
   */
  stopCampaignMonitoring(campaignId) {
    const channel = this.realTimeChannels.get(campaignId);
    if (channel) {
      channel.unsubscribe();
      this.realTimeChannels.delete(campaignId);
      console.log(`📡 Stopped monitoring campaign: ${campaignId}`);
    }
  }

  /**
   * Data lifecycle management - archive old campaigns
   * @param {number} daysOld - Age threshold in days
   * @returns {Promise<Object>} Archive results
   */
  async archiveOldCampaigns(daysOld = 90) {
    console.log(`🗄️ Archiving campaigns older than ${daysOld} days`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const { data, error } = await this.supabase.rpc('archive_old_campaigns', {
        cutoff_date: cutoffDate.toISOString()
      });

      if (error) {
        console.error('❌ Archive error:', error);
        throw error;
      }

      console.log(`✅ Archived ${data} old campaigns`);
      return { archived: data };
    } catch (error) {
      console.error('❌ Archive operation failed:', error);
      throw error;
    }
  }

  /**
   * Clean up old API usage logs
   * @param {number} retentionDays - Days to retain logs
   */
  async cleanupApiLogs(retentionDays = 30) {
    console.log(`🧹 Cleaning up API logs older than ${retentionDays} days`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const { error } = await this.supabase
      .from('api_usage_log')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('❌ API log cleanup error:', error);
    } else {
      console.log('✅ API logs cleaned up');
    }
  }

  /**
   * Utility functions for data processing
   */

  calculateConfidenceScore(leadData) {
    let score = 0;
    
    // Basic data completeness (40 points)
    if (leadData.business_name) score += 10;
    if (leadData.phone) score += 10;
    if (leadData.address) score += 10;
    if (leadData.website) score += 10;
    
    // Contact data (30 points)
    if (leadData.emails?.length > 0) {
      score += 20;
      if (leadData.emails.some(e => e.verification_status === 'deliverable')) score += 10;
    }
    
    // Social proof (20 points)
    if (leadData.rating >= 4.0) score += 10;
    if (leadData.review_count >= 10) score += 5;
    if (leadData.social_links && Object.keys(leadData.social_links).length > 0) score += 5;
    
    // Government verification (10 points)
    if (leadData.registry_verified) score += 10;
    
    return Math.min(100, score);
  }

  calculateCompletenessScore(leadData) {
    const fields = ['business_name', 'phone', 'address', 'website', 'emails'];
    const completedFields = fields.filter(field => {
      if (field === 'emails') return leadData.emails?.length > 0;
      return leadData[field];
    });
    
    return Math.round((completedFields.length / fields.length) * 100);
  }

  extractUsernameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      return pathParts.length > 0 ? pathParts[0] : null;
    } catch {
      return null;
    }
  }

  /**
   * Export leads with comprehensive data
   * @param {string} campaignId - Campaign to export
   * @param {Object} exportOptions - Export configuration
   * @returns {Promise<Object>} Export results
   */
  async exportCampaignLeads(campaignId, exportOptions = {}) {
    console.log(`📤 Exporting leads for campaign: ${campaignId}`);
    
    const filters = {
      campaignIds: [campaignId],
      minConfidence: exportOptions.minConfidence || 70,
      hasEmail: exportOptions.requireEmail || false,
      limit: exportOptions.limit || 1000
    };

    const leads = await this.getQualifiedLeads(filters);
    
    // Mark as exported
    if (leads.length > 0) {
      const leadIds = leads.map(l => l.id);
      await this.supabase
        .from('enhanced_leads')
        .update({ 
          export_status: 'exported', 
          exported_at: new Date().toISOString() 
        })
        .in('id', leadIds);
    }

    return {
      campaign_id: campaignId,
      exported_leads: leads.length,
      export_timestamp: new Date().toISOString(),
      leads: leads
    };
  }
}

module.exports = EnhancedSupabaseClient;