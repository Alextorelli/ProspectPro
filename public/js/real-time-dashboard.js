/**
 * Real-Time Campaign Dashboard - Live monitoring and analytics
 * Comprehensive campaign tracking with live updates and budget alerts
 */

class RealTimeCampaignDashboard {
  constructor(supabaseClient, containerId) {
    this.supabase = supabaseClient;
    this.container = document.getElementById(containerId);
    this.currentCampaign = null;
    this.subscription = null;
    this.charts = {};
    this.refreshInterval = null;
    
    this.initializeDashboard();
  }

  /**
   * Initialize dashboard UI and event listeners
   */
  initializeDashboard() {
    this.container.innerHTML = `
      <div class="dashboard-header">
        <h2>🚀 Campaign Monitor</h2>
        <div class="campaign-selector">
          <select id="campaignSelect">
            <option value="">Select Campaign</option>
          </select>
          <button id="refreshBtn" class="btn-secondary">🔄 Refresh</button>
        </div>
      </div>
      
      <div class="dashboard-content" style="display: none;">
        <!-- Live Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card leads-discovered">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value" id="totalLeads">0</div>
              <div class="stat-label">Total Leads</div>
              <div class="stat-change" id="leadsChange">+0 today</div>
            </div>
          </div>
          
          <div class="stat-card qualified-leads">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-value" id="qualifiedLeads">0</div>
              <div class="stat-label">Qualified Leads</div>
              <div class="stat-change" id="qualifiedRate">0%</div>
            </div>
          </div>
          
          <div class="stat-card total-cost">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <div class="stat-value" id="totalCost">$0.00</div>
              <div class="stat-label">Total Cost</div>
              <div class="stat-change" id="costPerLead">$0.00/lead</div>
            </div>
          </div>
          
          <div class="stat-card confidence-score">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <div class="stat-value" id="avgConfidence">0%</div>
              <div class="stat-label">Avg Confidence</div>
              <div class="stat-change" id="confidenceTrend">stable</div>
            </div>
          </div>
        </div>

        <!-- Budget Alert -->
        <div id="budgetAlert" class="alert alert-warning" style="display: none;">
          <div class="alert-icon">⚠️</div>
          <div class="alert-content">
            <strong>Budget Alert:</strong>
            <span id="budgetMessage">Campaign approaching budget limit</span>
          </div>
        </div>

        <!-- Live Activity Feed -->
        <div class="dashboard-section">
          <div class="section-header">
            <h3>📡 Live Activity</h3>
            <div class="connection-status" id="connectionStatus">
              <div class="status-dot offline"></div>
              <span>Disconnected</span>
            </div>
          </div>
          <div class="activity-feed" id="activityFeed">
            <div class="activity-item placeholder">
              <div class="activity-time">--:--</div>
              <div class="activity-content">Waiting for updates...</div>
            </div>
          </div>
        </div>

        <!-- Quality Distribution Chart -->
        <div class="dashboard-section">
          <div class="section-header">
            <h3>📈 Quality Distribution</h3>
          </div>
          <div class="chart-container">
            <canvas id="qualityChart" width="400" height="200"></canvas>
          </div>
        </div>

        <!-- API Usage Breakdown -->
        <div class="dashboard-section">
          <div class="section-header">
            <h3>🔧 API Usage</h3>
          </div>
          <div class="api-usage-grid" id="apiUsageGrid">
            <!-- API usage cards will be dynamically added -->
          </div>
        </div>

        <!-- Recent Leads Table -->
        <div class="dashboard-section">
          <div class="section-header">
            <h3>🎯 Recent High-Quality Leads</h3>
            <button id="exportBtn" class="btn-primary">📤 Export</button>
          </div>
          <div class="leads-table-container">
            <table id="recentLeadsTable" class="leads-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Confidence</th>
                  <th>Contact Info</th>
                  <th>Cost</th>
                  <th>Discovered</th>
                </tr>
              </thead>
              <tbody id="recentLeadsBody">
                <tr class="placeholder-row">
                  <td colspan="5">No leads found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.loadCampaigns();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const campaignSelect = document.getElementById('campaignSelect');
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');

    campaignSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        this.selectCampaign(e.target.value);
      } else {
        this.disconnectFromCampaign();
      }
    });

    refreshBtn.addEventListener('click', () => {
      if (this.currentCampaign) {
        this.refreshCampaignData();
      }
    });

    exportBtn.addEventListener('click', () => {
      if (this.currentCampaign) {
        this.exportCampaignLeads();
      }
    });
  }

  /**
   * Load available campaigns
   */
  async loadCampaigns() {
    try {
      const { data: campaigns, error } = await this.supabase.enhanced
        .from('campaigns')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const select = document.getElementById('campaignSelect');
      select.innerHTML = '<option value="">Select Campaign</option>';

      campaigns.forEach(campaign => {
        const option = document.createElement('option');
        option.value = campaign.id;
        option.textContent = `${campaign.name} (${campaign.status})`;
        select.appendChild(option);
      });

    } catch (error) {
      console.error('❌ Failed to load campaigns:', error);
      this.showError('Failed to load campaigns');
    }
  }

  /**
   * Select and monitor a campaign
   */
  async selectCampaign(campaignId) {
    try {
      console.log(`📡 Selecting campaign: ${campaignId}`);
      
      // Disconnect from previous campaign
      this.disconnectFromCampaign();
      
      this.currentCampaign = campaignId;
      
      // Show dashboard content
      document.querySelector('.dashboard-content').style.display = 'block';
      
      // Load initial campaign data
      await this.loadCampaignData();
      
      // Set up real-time monitoring
      this.setupRealTimeMonitoring();
      
      // Start periodic refresh
      this.startPeriodicRefresh();
      
    } catch (error) {
      console.error('❌ Failed to select campaign:', error);
      this.showError('Failed to load campaign data');
    }
  }

  /**
   * Load campaign data and analytics
   */
  async loadCampaignData() {
    if (!this.currentCampaign) return;

    try {
      console.log('📊 Loading campaign analytics...');
      
      // Load comprehensive analytics
      const analytics = await this.supabase.enhanced.getCampaignAnalytics(this.currentCampaign);
      
      // Update dashboard
      this.updateStatsCards(analytics);
      this.updateQualityChart(analytics.quality_distribution);
      this.updateApiUsage(analytics.api_usage_breakdown);
      this.checkBudgetAlerts(analytics);
      
      // Load recent high-quality leads
      await this.loadRecentLeads();
      
    } catch (error) {
      console.error('❌ Failed to load campaign data:', error);
      this.showError('Failed to load campaign analytics');
    }
  }

  /**
   * Set up real-time monitoring
   */
  setupRealTimeMonitoring() {
    if (!this.currentCampaign) return;

    console.log('📡 Setting up real-time monitoring...');
    
    const callbacks = {
      onNewLead: (lead) => {
        this.handleNewLead(lead);
      },
      onCampaignUpdate: (campaign) => {
        this.handleCampaignUpdate(campaign);
      },
      onStatusChange: (status) => {
        this.updateConnectionStatus(status);
      }
    };

    this.subscription = this.supabase.enhanced.setupCampaignMonitoring(
      this.currentCampaign, 
      callbacks
    );
  }

  /**
   * Handle new lead discovered
   */
  handleNewLead(lead) {
    console.log('🎉 New lead discovered:', lead.business_name);
    
    // Add to activity feed
    this.addToActivityFeed({
      type: 'new_lead',
      message: `New lead discovered: ${lead.business_name}`,
      confidence: lead.confidence_score,
      cost: lead.total_cost,
      timestamp: new Date()
    });
    
    // Update stats (will be refreshed automatically)
    this.scheduleStatsRefresh();
    
    // Show notification if high-quality lead
    if (lead.confidence_score >= 80) {
      this.showNotification(`🎯 High-quality lead found: ${lead.business_name} (${lead.confidence_score}% confidence)`, 'success');
    }
  }

  /**
   * Handle campaign updates
   */
  handleCampaignUpdate(campaign) {
    console.log('📊 Campaign updated:', campaign);
    
    this.addToActivityFeed({
      type: 'campaign_update',
      message: `Campaign updated: ${campaign.name}`,
      timestamp: new Date()
    });
    
    this.scheduleStatsRefresh();
  }

  /**
   * Update connection status indicator
   */
  updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    const dot = statusElement.querySelector('.status-dot');
    const text = statusElement.querySelector('span');
    
    dot.className = `status-dot ${status === 'SUBSCRIBED' ? 'connected' : 'offline'}`;
    text.textContent = status === 'SUBSCRIBED' ? 'Connected' : 'Disconnected';
    
    console.log(`📡 Connection status: ${status}`);
  }

  /**
   * Update stats cards
   */
  updateStatsCards(analytics) {
    document.getElementById('totalLeads').textContent = analytics.total_leads || 0;
    document.getElementById('qualifiedLeads').textContent = analytics.qualified_leads || 0;
    document.getElementById('totalCost').textContent = `$${(analytics.total_cost || 0).toFixed(2)}`;
    document.getElementById('avgConfidence').textContent = `${analytics.average_confidence || 0}%`;
    
    // Calculate rates and changes
    const qualificationRate = analytics.total_leads > 0 ? 
      Math.round((analytics.qualified_leads / analytics.total_leads) * 100) : 0;
    document.getElementById('qualifiedRate').textContent = `${qualificationRate}%`;
    
    const costPerLead = analytics.cost_per_lead || 0;
    document.getElementById('costPerLead').textContent = `$${costPerLead}/lead`;
  }

  /**
   * Update quality distribution chart
   */
  updateQualityChart(qualityData) {
    const canvas = document.getElementById('qualityChart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!qualityData) return;
    
    const data = [
      { label: 'Excellent (90-100%)', value: qualityData.excellent || 0, color: '#10B981' },
      { label: 'Very Good (80-89%)', value: qualityData.very_good || 0, color: '#3B82F6' },
      { label: 'Good (70-79%)', value: qualityData.good || 0, color: '#F59E0B' },
      { label: 'Average (50-69%)', value: qualityData.average || 0, color: '#EF4444' },
      { label: 'Poor (<50%)', value: qualityData.poor || 0, color: '#6B7280' }
    ];
    
    this.drawBarChart(ctx, data, canvas.width, canvas.height);
  }

  /**
   * Simple bar chart drawing
   */
  drawBarChart(ctx, data, width, height) {
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', width / 2, height / 2);
      return;
    }
    
    const barWidth = chartWidth / data.length - 10;
    
    data.forEach((item, index) => {
      const barHeight = (item.value / total) * chartHeight;
      const x = padding + index * (barWidth + 10);
      const y = height - padding - barHeight;
      
      // Draw bar
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw value
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
      
      // Draw label (rotated)
      ctx.save();
      ctx.translate(x + barWidth / 2, height - padding + 20);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(item.label, 0, 0);
      ctx.restore();
    });
  }

  /**
   * Update API usage section
   */
  updateApiUsage(apiUsageData) {
    const container = document.getElementById('apiUsageGrid');
    container.innerHTML = '';
    
    if (!apiUsageData) {
      container.innerHTML = '<p>No API usage data available</p>';
      return;
    }
    
    Object.entries(apiUsageData).forEach(([service, usage]) => {
      const card = document.createElement('div');
      card.className = 'api-usage-card';
      card.innerHTML = `
        <div class="api-service-name">${service}</div>
        <div class="api-stats">
          <div class="api-stat">
            <span class="api-stat-value">${usage.requests_made}</span>
            <span class="api-stat-label">Requests</span>
          </div>
          <div class="api-stat">
            <span class="api-stat-value">$${usage.total_cost.toFixed(3)}</span>
            <span class="api-stat-label">Cost</span>
          </div>
          <div class="api-stat">
            <span class="api-stat-value">${usage.success_rate}%</span>
            <span class="api-stat-label">Success</span>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  /**
   * Load recent high-quality leads
   */
  async loadRecentLeads() {
    if (!this.currentCampaign) return;
    
    try {
      const filters = {
        campaignIds: [this.currentCampaign],
        minConfidence: 70,
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 20
      };
      
      const leads = await this.supabase.enhanced.getQualifiedLeads(filters);
      
      this.updateRecentLeadsTable(leads);
      
    } catch (error) {
      console.error('❌ Failed to load recent leads:', error);
    }
  }

  /**
   * Update recent leads table
   */
  updateRecentLeadsTable(leads) {
    const tbody = document.getElementById('recentLeadsBody');
    
    if (!leads || leads.length === 0) {
      tbody.innerHTML = '<tr class="placeholder-row"><td colspan="5">No high-quality leads found</td></tr>';
      return;
    }
    
    tbody.innerHTML = leads.map(lead => `
      <tr class="lead-row" data-confidence="${lead.confidence_score}">
        <td>
          <div class="business-name">${lead.business_name}</div>
          <div class="business-address">${lead.address || 'No address'}</div>
        </td>
        <td>
          <div class="confidence-badge confidence-${this.getConfidenceClass(lead.confidence_score)}">
            ${lead.confidence_score}%
          </div>
        </td>
        <td>
          <div class="contact-info">
            ${lead.phone ? `📞 ${lead.phone}<br>` : ''}
            ${lead.lead_emails?.length ? `📧 ${lead.lead_emails.length} emails<br>` : ''}
            ${lead.website ? `🌐 Website` : ''}
          </div>
        </td>
        <td class="cost-cell">$${(lead.total_cost || 0).toFixed(3)}</td>
        <td class="time-cell">${this.formatTimeAgo(lead.created_at)}</td>
      </tr>
    `).join('');
  }

  /**
   * Add item to activity feed
   */
  addToActivityFeed(activity) {
    const feed = document.getElementById('activityFeed');
    
    // Remove placeholder
    const placeholder = feed.querySelector('.placeholder');
    if (placeholder) placeholder.remove();
    
    const item = document.createElement('div');
    item.className = `activity-item ${activity.type}`;
    item.innerHTML = `
      <div class="activity-time">${activity.timestamp.toLocaleTimeString()}</div>
      <div class="activity-content">
        ${activity.message}
        ${activity.confidence ? `<span class="confidence-badge">${activity.confidence}%</span>` : ''}
        ${activity.cost ? `<span class="cost-badge">$${activity.cost.toFixed(3)}</span>` : ''}
      </div>
    `;
    
    // Add to top of feed
    feed.insertBefore(item, feed.firstChild);
    
    // Keep only last 20 items
    while (feed.children.length > 20) {
      feed.removeChild(feed.lastChild);
    }
  }

  /**
   * Check and display budget alerts
   */
  checkBudgetAlerts(analytics) {
    const alertElement = document.getElementById('budgetAlert');
    const messageElement = document.getElementById('budgetMessage');
    
    if (analytics.budget_utilization && analytics.budget_utilization > 80) {
      messageElement.textContent = `Campaign has used ${analytics.budget_utilization}% of budget`;
      alertElement.style.display = 'block';
      
      if (analytics.budget_utilization > 95) {
        alertElement.className = 'alert alert-error';
        messageElement.textContent = `⚠️ CRITICAL: Campaign has used ${analytics.budget_utilization}% of budget!`;
      }
    } else {
      alertElement.style.display = 'none';
    }
  }

  /**
   * Export campaign leads
   */
  async exportCampaignLeads() {
    if (!this.currentCampaign) return;
    
    try {
      console.log('📤 Exporting campaign leads...');
      
      const exportResult = await this.supabase.enhanced.exportCampaignLeads(
        this.currentCampaign,
        { minConfidence: 70, requireEmail: true }
      );
      
      // Create and download CSV
      const csvContent = this.generateCSV(exportResult.leads);
      this.downloadCSV(csvContent, `campaign-leads-${new Date().toISOString().split('T')[0]}.csv`);
      
      this.showNotification(`✅ Exported ${exportResult.exported_leads} leads`, 'success');
      
    } catch (error) {
      console.error('❌ Export failed:', error);
      this.showError('Failed to export leads');
    }
  }

  /**
   * Generate CSV content
   */
  generateCSV(leads) {
    const headers = ['Business Name', 'Phone', 'Address', 'Website', 'Emails', 'Confidence Score', 'Total Cost'];
    const rows = leads.map(lead => [
      lead.business_name || '',
      lead.phone || '',
      lead.address || '',
      lead.website || '',
      lead.lead_emails?.map(e => e.email).join(';') || '',
      lead.confidence_score || 0,
      lead.total_cost || 0
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  /**
   * Download CSV file
   */
  downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Utility functions
   */
  
  getConfidenceClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'very-good';
    if (score >= 70) return 'good';
    if (score >= 50) return 'average';
    return 'poor';
  }
  
  formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }

  scheduleStatsRefresh() {
    // Debounced refresh to avoid too frequent updates
    clearTimeout(this.statsRefreshTimeout);
    this.statsRefreshTimeout = setTimeout(() => {
      this.loadCampaignData();
    }, 2000);
  }

  startPeriodicRefresh() {
    // Refresh data every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadCampaignData();
    }, 30000);
  }

  stopPeriodicRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  refreshCampaignData() {
    if (this.currentCampaign) {
      this.loadCampaignData();
    }
  }

  disconnectFromCampaign() {
    if (this.subscription) {
      this.supabase.enhanced.stopCampaignMonitoring(this.currentCampaign);
      this.subscription = null;
    }
    
    this.stopPeriodicRefresh();
    this.currentCampaign = null;
    
    // Hide dashboard content
    document.querySelector('.dashboard-content').style.display = 'none';
    
    console.log('📡 Disconnected from campaign monitoring');
  }

  showNotification(message, type = 'info') {
    // Simple notification - in a real app, use a proper notification library
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  showError(message) {
    this.showNotification(`❌ ${message}`, 'error');
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    this.disconnectFromCampaign();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Export for use in other modules
window.RealTimeCampaignDashboard = RealTimeCampaignDashboard;