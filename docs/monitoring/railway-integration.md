# Railway Integration for ProspectPro Monitoring

## Overview
Integrate the enhanced monitoring capabilities with your Railway deployment. This guide adds monitoring API endpoints and real-time analytics to your ProspectPro application.

## Prerequisites  
- ✅ Railway deployment of ProspectPro
- ✅ Supabase monitoring schema deployed
- ✅ Environment variables configured
- ✅ Existing application running

## Step 1: Update Environment Variables

### 1.1 Add Monitoring Configuration
In your Railway dashboard, add these environment variables:

```bash
# Monitoring Configuration
ENABLE_MONITORING=true
MONITORING_ENDPOINT=/api/monitoring
REALTIME_UPDATES=true

# Analytics Configuration  
ANALYTICS_CACHE_TTL=300
MAX_DASHBOARD_QUERIES=50
ENABLE_COST_ALERTS=true
DAILY_BUDGET_ALERT=25.00

# Grafana Integration (Optional)
GRAFANA_URL=https://appsmithery.grafana.net
GRAFANA_API_KEY=your_grafana_api_key_here
```

### 1.2 Verify Supabase Configuration
Ensure these exist in Railway environment:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 2: Add Monitoring API Endpoints

### 2.1 Create Monitoring API Module
Create `api/monitoring.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class MonitoringAPI {
  // Dashboard metrics endpoint
  async getDashboardMetrics(req, res) {
    try {
      const { data: metrics, error } = await supabase
        .rpc('get_dashboard_realtime_metrics_current');
      
      if (error) throw error;
      
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Campaign analytics endpoint
  async getCampaignAnalytics(req, res) {
    try {
      const { campaignId } = req.params;
      
      const { data: analytics, error } = await supabase
        .rpc('campaign_analytics_current', { campaign_id_param: campaignId });
      
      if (error) throw error;
      
      res.json({
        success: true,
        data: analytics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Campaign analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // API cost breakdown endpoint  
  async getApiCostBreakdown(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const { data: costs, error } = await supabase
        .rpc('get_api_service_breakdown_current', {
          start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: endDate || new Date().toISOString().split('T')[0]
        });
      
      if (error) throw error;
      
      res.json({
        success: true,
        data: costs,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('API cost breakdown error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Service health status endpoint
  async getServiceHealth(req, res) {
    try {
      const { data: health, error } = await supabase
        .from('service_health_metrics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      
      // Group by service and get latest status
      const serviceHealth = {};
      health.forEach(metric => {
        if (!serviceHealth[metric.service_name] || 
            new Date(metric.timestamp) > new Date(serviceHealth[metric.service_name].timestamp)) {
          serviceHealth[metric.service_name] = metric;
        }
      });
      
      res.json({
        success: true,
        data: Object.values(serviceHealth),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Service health error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Cost tracking endpoint
  async trackApiCost(service, endpoint, cost, success = true, responseTime = 0) {
    try {
      const { data, error } = await supabase
        .from('api_cost_tracking')
        .insert([{
          api_service: service,
          endpoint: endpoint,
          total_cost: cost,
          success_count: success ? 1 : 0,
          error_count: success ? 0 : 1,
          avg_response_time_ms: responseTime
        }]);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Cost tracking error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update service health
  async updateServiceHealth(serviceName, status, responseTime = 0, errorRate = 0) {
    try {
      const { data, error } = await supabase
        .from('service_health_metrics')
        .insert([{
          service_name: serviceName,
          status: status,
          response_time_ms: responseTime,
          error_rate: errorRate,
          requests_today: 1,
          cost_today: 0,
          last_successful_call: status === 'healthy' ? new Date().toISOString() : null
        }]);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Service health update error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new MonitoringAPI();
```

### 2.2 Add Monitoring Routes  
Update your main `server.js` or `app.js`:

```javascript
const monitoringAPI = require('./api/monitoring');

// Monitoring endpoints
app.get('/api/monitoring/dashboard', monitoringAPI.getDashboardMetrics);
app.get('/api/monitoring/campaign/:campaignId', monitoringAPI.getCampaignAnalytics);
app.get('/api/monitoring/costs', monitoringAPI.getApiCostBreakdown);
app.get('/api/monitoring/health', monitoringAPI.getServiceHealth);

// Add monitoring middleware to existing API calls
const trackApiCall = async (service, endpoint, cost, success, responseTime) => {
  if (process.env.ENABLE_MONITORING === 'true') {
    await monitoringAPI.trackApiCost(service, endpoint, cost, success, responseTime);
  }
};

// Example: Update existing Google Places integration
app.post('/api/discover-businesses', async (req, res) => {
  const startTime = Date.now();
  try {
    // Your existing business discovery logic
    const result = await discoverBusinesses(req.body);
    
    // Track successful API call
    const responseTime = Date.now() - startTime;
    await trackApiCall('google_places', '/discover-businesses', result.cost || 0, true, responseTime);
    
    res.json(result);
  } catch (error) {
    // Track failed API call
    const responseTime = Date.now() - startTime;
    await trackApiCall('google_places', '/discover-businesses', 0, false, responseTime);
    
    res.status(500).json({ error: error.message });
  }
});
```

## Step 3: Update Frontend with Monitoring

### 3.1 Add Monitoring Dashboard Component
Create `public/js/monitoring-dashboard.js`:

```javascript
class MonitoringDashboard {
  constructor() {
    this.apiBase = '/api/monitoring';
    this.refreshInterval = 30000; // 30 seconds
    this.init();
  }

  async init() {
    await this.loadDashboardMetrics();
    await this.loadServiceHealth();
    this.startAutoRefresh();
  }

  async loadDashboardMetrics() {
    try {
      const response = await fetch(`${this.apiBase}/dashboard`);
      const data = await response.json();
      
      if (data.success) {
        this.updateDashboardUI(data.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
    }
  }

  async loadServiceHealth() {
    try {
      const response = await fetch(`${this.apiBase}/health`);
      const data = await response.json();
      
      if (data.success) {
        this.updateServiceHealthUI(data.data);
      }
    } catch (error) {
      console.error('Failed to load service health:', error);
    }
  }

  updateDashboardUI(metrics) {
    // Update dashboard UI elements
    document.getElementById('active-campaigns').textContent = 
      metrics.overview?.active_campaigns || 0;
    document.getElementById('total-leads').textContent = 
      metrics.overview?.total_leads_discovered || 0;
    document.getElementById('qualified-leads').textContent = 
      metrics.overview?.total_qualified_leads || 0;
    document.getElementById('daily-cost').textContent = 
      `$${(metrics.overview?.total_cost_today || 0).toFixed(2)}`;
  }

  updateServiceHealthUI(healthData) {
    const container = document.getElementById('service-health-container');
    if (!container) return;

    container.innerHTML = healthData.map(service => `
      <div class="service-health-item ${service.status}">
        <div class="service-name">${service.service_name}</div>
        <div class="service-status">${service.status}</div>
        <div class="service-metrics">
          <span>Response: ${service.response_time_ms}ms</span>
          <span>Requests: ${service.requests_today}</span>
          <span>Cost: $${service.cost_today}</span>
        </div>
      </div>
    `).join('');
  }

  startAutoRefresh() {
    setInterval(() => {
      this.loadDashboardMetrics();
      this.loadServiceHealth();
    }, this.refreshInterval);
  }

  async loadCampaignAnalytics(campaignId) {
    try {
      const response = await fetch(`${this.apiBase}/campaign/${campaignId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
    } catch (error) {
      console.error('Failed to load campaign analytics:', error);
    }
  }
}

// Initialize monitoring dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('monitoring-dashboard')) {
    new MonitoringDashboard();
  }
});
```

### 3.2 Add Monitoring UI to HTML
Update your main HTML template:

```html
<!-- Add to your dashboard page -->
<div id="monitoring-dashboard" class="monitoring-section">
  <h2>ProspectPro Analytics</h2>
  
  <div class="metrics-grid">
    <div class="metric-card">
      <h3>Active Campaigns</h3>
      <div id="active-campaigns" class="metric-value">-</div>
    </div>
    
    <div class="metric-card">
      <h3>Total Leads</h3>
      <div id="total-leads" class="metric-value">-</div>
    </div>
    
    <div class="metric-card">
      <h3>Qualified Leads</h3>
      <div id="qualified-leads" class="metric-value">-</div>
    </div>
    
    <div class="metric-card">
      <h3>Daily Cost</h3>
      <div id="daily-cost" class="metric-value">$0.00</div>
    </div>
  </div>
  
  <div class="service-health-section">
    <h3>Service Health</h3>
    <div id="service-health-container"></div>
  </div>
</div>
```

### 3.3 Add Monitoring Styles
Add to your CSS:

```css
.monitoring-section {
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.metric-value {
  font-size: 2em;
  font-weight: bold;
  color: #2c5aa0;
  margin-top: 10px;
}

.service-health-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin: 10px 0;
  background: white;
  border-radius: 6px;
  border-left: 4px solid #ddd;
}

.service-health-item.healthy {
  border-left-color: #28a745;
}

.service-health-item.warning {
  border-left-color: #ffc107;
}

.service-health-item.error {
  border-left-color: #dc3545;
}

.service-metrics span {
  margin-left: 15px;
  font-size: 0.9em;
  color: #666;
}
```

## Step 4: Deploy to Railway

### 4.1 Commit Changes
```bash
git add .
git commit -m "Add monitoring integration and analytics endpoints"
git push origin main
```

### 4.2 Verify Deployment
After Railway deploys:

1. **Check logs**: Monitor Railway deployment logs
2. **Test endpoints**: Visit `/api/monitoring/dashboard`
3. **Verify UI**: Check monitoring dashboard displays data

### 4.3 Configure Alerts (Optional)
Set up Railway notifications for:
- High API costs
- Service failures
- Performance issues

## Step 5: Testing & Validation

### 5.1 Test Monitoring Endpoints
```bash
# Test dashboard metrics
curl https://your-app.railway.app/api/monitoring/dashboard

# Test service health
curl https://your-app.railway.app/api/monitoring/health

# Test cost breakdown
curl https://your-app.railway.app/api/monitoring/costs
```

### 5.2 Validate Data Flow
1. **Generate test campaigns** and verify metrics update
2. **Make API calls** and check cost tracking
3. **Monitor service health** indicators

## Troubleshooting

### Common Issues

#### Issue: "Function not found" errors
**Solution**: Ensure monitoring schema is deployed to Supabase first

#### Issue: Authentication errors  
**Solution**: Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly in Railway

#### Issue: CORS errors on frontend
**Solution**: Add monitoring endpoints to CORS allowed origins

#### Issue: High memory usage
**Solution**: Implement query result caching and limit historical data ranges

### Performance Optimization
- **Cache frequently accessed metrics** (5-minute TTL)
- **Limit query date ranges** to last 30 days by default  
- **Use database indexes** for monitoring queries
- **Batch API cost tracking** updates

## Next Steps
1. [Set up Grafana dashboards](grafana-setup.md) for advanced visualization
2. Configure automated alerting for budget limits
3. Add custom monitoring metrics specific to your business needs
4. Implement scheduled reports and analytics exports

Your ProspectPro application now has enterprise-level monitoring integrated! 📊🚀