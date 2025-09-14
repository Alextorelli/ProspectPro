# ProspectPro Integrated Dashboard System - Free Visualization Tools Guide

## 🎯 Recommended Architecture: Grafana + Supabase Integration

Based on research of free visualization tools and your stack requirements, **Grafana** emerges as the optimal solution for ProspectPro's monitoring needs:

- **Free Tier**: 3 users, 10K metrics series, 50GB logs/traces (sufficient for your use case)
- **Native PostgreSQL/Supabase Integration**: Direct database connections
- **CSV/Excel Export**: Built-in functionality for pricing model analysis
- **API Monitoring Templates**: Pre-built dashboards for service monitoring
- **Cost Tracking Capabilities**: Specialized dashboards for financial metrics

## 📊 Dashboard Architecture Overview

### **Primary Dashboard: Grafana Cloud (Free)**
- **Real-time service monitoring** (Hunter.io, ScrapingDog, etc.)
- **Campaign performance tracking**
- **Cost analysis and ROI metrics**
- **API usage and rate limiting monitoring**
- **Export functionality** for Excel pricing models

### **Secondary Dashboard: Supabase Native**
- **Database performance metrics**
- **Real-time query monitoring**
- **Basic campaign analytics**

### **Specialized Tool: Apache Superset (Self-hosted)**
- **Complex data analysis and reporting**
- **Advanced SQL-based cost modeling**
- **Multi-dashboard exports for stakeholder reports**

---

## 🚀 Implementation Plan

### **Phase 1: Grafana Integration (Week 1-2)**

#### **Step 1: Grafana Cloud Setup**
```bash
# 1. Sign up for free Grafana Cloud account
# Go to: https://grafana.com/auth/sign-up/create-user
# Select "Free" plan (3 users, 10K series)

# 2. Get your Grafana connection details
GRAFANA_INSTANCE_URL="https://your-instance.grafana.net"
GRAFANA_API_KEY="your_api_key_here"  # From API Keys section
```

#### **Step 2: Supabase Data Source Configuration**
```javascript
// Grafana PostgreSQL Data Source Configuration
const dataSourceConfig = {
  name: "ProspectPro-Supabase",
  type: "postgres",
  url: process.env.SUPABASE_DB_URL,
  access: "proxy",
  user: "postgres",
  database: "postgres",
  basicAuth: false,
  withCredentials: false,
  isDefault: false,
  jsonData: {
    sslmode: "require",
    maxOpenConns: 5,
    maxIdleConns: 2,
    connMaxLifetime: 14400,
    postgresVersion: 1300,
    timescaledb: false
  },
  secureJsonData: {
    password: process.env.SUPABASE_DB_PASSWORD
  }
};
```

#### **Step 3: Enhanced Database Schema for Monitoring**
```sql
-- Campaign metrics tracking table
CREATE TABLE campaign_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(12,4),
  metric_type TEXT, -- 'cost', 'usage', 'performance', 'quality'
  api_service TEXT, -- 'hunter_io', 'scrapingdog', 'google_places'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- API cost tracking table (enhanced)
CREATE TABLE api_cost_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  api_service TEXT NOT NULL,
  endpoint TEXT,
  request_count INTEGER DEFAULT 1,
  cost_per_request DECIMAL(8,4),
  total_cost DECIMAL(10,4),
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  date DATE DEFAULT CURRENT_DATE,
  hour INTEGER DEFAULT EXTRACT(hour FROM now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Qualified leads metrics
CREATE TABLE lead_qualification_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  total_leads_discovered INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  qualification_rate DECIMAL(5,4), -- Calculated: qualified/total
  avg_confidence_score DECIMAL(5,2),
  total_api_calls INTEGER DEFAULT 0,
  total_api_cost DECIMAL(10,4) DEFAULT 0,
  cost_per_qualified_lead DECIMAL(8,4), -- Key metric!
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Real-time service health
CREATE TABLE service_health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL, -- 'hunter_io', 'scrapingdog', etc.
  status TEXT NOT NULL, -- 'healthy', 'degraded', 'down'
  response_time_ms INTEGER,
  error_rate DECIMAL(5,4), -- Percentage
  rate_limit_remaining INTEGER,
  cost_budget_remaining DECIMAL(10,2),
  last_successful_call TIMESTAMP WITH TIME ZONE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_campaign_analytics_campaign_date ON campaign_analytics(campaign_id, DATE(timestamp));
CREATE INDEX idx_api_cost_tracking_service_date ON api_cost_tracking(api_service, date);
CREATE INDEX idx_lead_qualification_date ON lead_qualification_metrics(date DESC);
CREATE INDEX idx_service_health_timestamp ON service_health_metrics(service_name, timestamp DESC);
```

#### **Step 4: Key Metrics Functions**
```sql
-- Aggregate cost per qualified lead function
CREATE OR REPLACE FUNCTION calculate_cost_per_qualified_lead(
  campaign_id_param UUID DEFAULT NULL,
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  campaign_id UUID,
  campaign_name TEXT,
  total_api_cost DECIMAL(10,4),
  total_qualified_leads INTEGER,
  cost_per_qualified_lead DECIMAL(8,4),
  roi_percentage DECIMAL(8,4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as campaign_id,
    c.name as campaign_name,
    COALESCE(SUM(act.total_cost), 0) as total_api_cost,
    COALESCE(SUM(lqm.leads_qualified), 0) as total_qualified_leads,
    CASE 
      WHEN SUM(lqm.leads_qualified) > 0 
      THEN COALESCE(SUM(act.total_cost), 0) / SUM(lqm.leads_qualified)
      ELSE 0 
    END as cost_per_qualified_lead,
    CASE 
      WHEN SUM(act.total_cost) > 0 
      THEN ((SUM(lqm.leads_qualified) * 10.0) - SUM(act.total_cost)) / SUM(act.total_cost) * 100
      ELSE 0 
    END as roi_percentage -- Assuming $10 value per qualified lead
  FROM campaigns c
  LEFT JOIN api_cost_tracking act ON c.id = act.campaign_id 
    AND act.date BETWEEN start_date AND end_date
  LEFT JOIN lead_qualification_metrics lqm ON c.id = lqm.campaign_id 
    AND lqm.date BETWEEN start_date AND end_date
  WHERE (campaign_id_param IS NULL OR c.id = campaign_id_param)
  GROUP BY c.id, c.name
  ORDER BY cost_per_qualified_lead ASC;
END;
$$ LANGUAGE plpgsql;

-- Real-time campaign performance
CREATE OR REPLACE FUNCTION get_realtime_campaign_metrics(campaign_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'campaign_id', campaign_id_param,
    'current_leads_discovered', (
      SELECT COUNT(*) FROM enhanced_leads WHERE campaign_id = campaign_id_param
    ),
    'current_qualified_leads', (
      SELECT COUNT(*) FROM enhanced_leads 
      WHERE campaign_id = campaign_id_param AND confidence_score >= 80
    ),
    'total_cost_today', (
      SELECT COALESCE(SUM(total_cost), 0) 
      FROM api_cost_tracking 
      WHERE campaign_id = campaign_id_param AND date = CURRENT_DATE
    ),
    'api_calls_today', (
      SELECT COALESCE(SUM(request_count), 0) 
      FROM api_cost_tracking 
      WHERE campaign_id = campaign_id_param AND date = CURRENT_DATE
    ),
    'qualification_rate', (
      SELECT CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND(COUNT(*) FILTER (WHERE confidence_score >= 80) * 100.0 / COUNT(*), 2)
        ELSE 0 
      END
      FROM enhanced_leads WHERE campaign_id = campaign_id_param
    ),
    'avg_cost_per_lead', (
      SELECT CASE 
        WHEN COUNT(el.*) > 0 
        THEN COALESCE(SUM(act.total_cost), 0) / COUNT(el.*)
        ELSE 0 
      END
      FROM enhanced_leads el
      LEFT JOIN api_cost_tracking act ON el.campaign_id = act.campaign_id
      WHERE el.campaign_id = campaign_id_param
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

---

### **Phase 2: Grafana Dashboards Creation (Week 3-4)**

#### **Dashboard 1: Campaign Performance Overview**
```json
{
  "dashboard": {
    "title": "ProspectPro Campaign Performance",
    "panels": [
      {
        "title": "Cost Per Qualified Lead (Real-time)",
        "type": "stat",
        "targets": [
          {
            "rawSql": "SELECT cost_per_qualified_lead FROM calculate_cost_per_qualified_lead() WHERE campaign_name = '$campaign'",
            "format": "table"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "currencyUSD",
            "decimals": 4
          }
        }
      },
      {
        "title": "Daily API Costs by Service",
        "type": "timeseries",
        "targets": [
          {
            "rawSql": "SELECT date as time, api_service, SUM(total_cost) as cost FROM api_cost_tracking WHERE date >= NOW() - INTERVAL '30 days' GROUP BY date, api_service ORDER BY date",
            "format": "time_series"
          }
        ]
      },
      {
        "title": "Qualification Rate Trend",
        "type": "timeseries",
        "targets": [
          {
            "rawSql": "SELECT date as time, AVG(qualification_rate * 100) as rate FROM lead_qualification_metrics WHERE date >= NOW() - INTERVAL '30 days' GROUP BY date ORDER BY date",
            "format": "time_series"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "max": 100
          }
        }
      }
    ]
  }
}
```

#### **Dashboard 2: API Service Monitoring**
```json
{
  "dashboard": {
    "title": "ProspectPro API Service Health",
    "panels": [
      {
        "title": "Service Status Overview",
        "type": "table",
        "targets": [
          {
            "rawSql": "SELECT service_name, status, response_time_ms, error_rate * 100 as error_rate_pct, rate_limit_remaining, cost_budget_remaining FROM service_health_metrics WHERE timestamp >= NOW() - INTERVAL '1 hour' ORDER BY timestamp DESC",
            "format": "table"
          }
        ]
      },
      {
        "title": "API Response Times",
        "type": "timeseries",
        "targets": [
          {
            "rawSql": "SELECT timestamp as time, service_name, response_time_ms FROM service_health_metrics WHERE timestamp >= NOW() - INTERVAL '24 hours' ORDER BY timestamp",
            "format": "time_series"
          }
        ]
      },
      {
        "title": "Budget Burn Rate",
        "type": "timeseries",
        "targets": [
          {
            "rawSql": "SELECT timestamp as time, service_name, cost_budget_remaining FROM service_health_metrics WHERE timestamp >= NOW() - INTERVAL '7 days' ORDER BY timestamp",
            "format": "time_series"
          }
        ]
      }
    ]
  }
}
```

#### **Dashboard 3: ROI and Financial Analysis**
```json
{
  "dashboard": {
    "title": "ProspectPro Financial Analytics",
    "panels": [
      {
        "title": "Monthly ROI by Campaign",
        "type": "barchart",
        "targets": [
          {
            "rawSql": "SELECT campaign_name, roi_percentage FROM calculate_cost_per_qualified_lead(NULL, DATE_TRUNC('month', CURRENT_DATE), CURRENT_DATE) ORDER BY roi_percentage DESC",
            "format": "table"
          }
        ]
      },
      {
        "title": "Cost Breakdown by API Service",
        "type": "piechart",
        "targets": [
          {
            "rawSql": "SELECT api_service, SUM(total_cost) as total FROM api_cost_tracking WHERE date >= DATE_TRUNC('month', CURRENT_DATE) GROUP BY api_service",
            "format": "table"
          }
        ]
      },
      {
        "title": "Efficiency Metrics",
        "type": "table",
        "targets": [
          {
            "rawSql": "SELECT campaign_name, total_qualified_leads, total_api_cost, cost_per_qualified_lead, CASE WHEN cost_per_qualified_lead < 0.50 THEN 'Excellent' WHEN cost_per_qualified_lead < 1.00 THEN 'Good' WHEN cost_per_qualified_lead < 2.00 THEN 'Fair' ELSE 'Poor' END as efficiency_rating FROM calculate_cost_per_qualified_lead() ORDER BY cost_per_qualified_lead ASC",
            "format": "table"
          }
        ]
      }
    ]
  }
}
```

---

### **Phase 3: Data Collection Integration (Week 5-6)**

#### **Enhanced API Cost Tracking Client**
```javascript
class ProspectProMetricsClient {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  // Track API usage in real-time
  async trackAPICall(campaignId, service, endpoint, cost, success, responseTime) {
    const metrics = {
      campaign_id: campaignId,
      api_service: service,
      endpoint: endpoint,
      request_count: 1,
      cost_per_request: cost,
      total_cost: cost,
      success_count: success ? 1 : 0,
      error_count: success ? 0 : 1,
      avg_response_time_ms: responseTime,
      date: new Date().toISOString().split('T')[0],
      hour: new Date().getHours()
    };

    const { error } = await this.supabase
      .from('api_cost_tracking')
      .insert(metrics);

    if (error) console.error('Metrics tracking error:', error);
  }

  // Update campaign qualification metrics
  async updateCampaignMetrics(campaignId) {
    const { data: campaignStats } = await this.supabase.rpc('get_realtime_campaign_metrics', {
      campaign_id_param: campaignId
    });

    if (campaignStats) {
      const qualificationMetrics = {
        campaign_id: campaignId,
        total_leads_discovered: campaignStats.current_leads_discovered,
        leads_qualified: campaignStats.current_qualified_leads,
        qualification_rate: campaignStats.qualification_rate / 100,
        avg_confidence_score: 0, // Calculate separately
        total_api_calls: campaignStats.api_calls_today,
        total_api_cost: campaignStats.total_cost_today,
        cost_per_qualified_lead: campaignStats.avg_cost_per_lead
      };

      const { error } = await this.supabase
        .from('lead_qualification_metrics')
        .upsert(qualificationMetrics, { 
          onConflict: 'campaign_id,date' 
        });

      if (error) console.error('Campaign metrics update error:', error);
    }
  }

  // Update service health status
  async updateServiceHealth(serviceName, status, responseTime, errorRate, rateLimitRemaining, budgetRemaining) {
    const healthMetrics = {
      service_name: serviceName,
      status: status,
      response_time_ms: responseTime,
      error_rate: errorRate,
      rate_limit_remaining: rateLimitRemaining,
      cost_budget_remaining: budgetRemaining,
      last_successful_call: status === 'healthy' ? new Date().toISOString() : null
    };

    const { error } = await this.supabase
      .from('service_health_metrics')
      .insert(healthMetrics);

    if (error) console.error('Service health update error:', error);
  }

  // Generate Excel export data
  async generateCostAnalysisExport(startDate, endDate) {
    const { data: costAnalysis } = await this.supabase
      .rpc('calculate_cost_per_qualified_lead', {
        start_date: startDate,
        end_date: endDate
      });

    const { data: apiBreakdown } = await this.supabase
      .from('api_cost_tracking')
      .select('api_service, date, total_cost, request_count, success_count, error_count')
      .gte('date', startDate)
      .lte('date', endDate);

    const { data: qualificationTrends } = await this.supabase
      .from('lead_qualification_metrics')
      .select('date, qualification_rate, cost_per_qualified_lead, total_api_calls')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    return {
      costAnalysis,
      apiBreakdown,
      qualificationTrends,
      exportTimestamp: new Date().toISOString()
    };
  }
}
```

#### **Integration with Existing ProspectPro Pipeline**
```javascript
// Enhanced business discovery with metrics tracking
const enhancedBusinessDiscoveryWithMetrics = async (query, location) => {
  const metricsClient = new ProspectProMetricsClient(supabase);
  const campaignId = generateCampaignId();
  
  try {
    // Google Places API call with tracking
    const startTime = Date.now();
    const placesResponse = await googlePlacesClient.search(query, location);
    const placesResponseTime = Date.now() - startTime;
    
    await metricsClient.trackAPICall(
      campaignId,
      'google_places',
      'text_search',
      0.032, // Cost per search
      placesResponse.status === 'OK',
      placesResponseTime
    );

    // Process leads and track costs for each enrichment API
    for (const business of placesResponse.results) {
      // Hunter.io email discovery tracking
      if (business.website) {
        const hunterStartTime = Date.now();
        try {
          const emails = await hunterClient.findEmails(business.website);
          await metricsClient.trackAPICall(
            campaignId,
            'hunter_io',
            'domain_search',
            0.098, // Cost per search
            true,
            Date.now() - hunterStartTime
          );
        } catch (error) {
          await metricsClient.trackAPICall(
            campaignId,
            'hunter_io',
            'domain_search',
            0.098,
            false,
            Date.now() - hunterStartTime
          );
        }
      }

      // ScrapingDog website scraping tracking
      if (business.website) {
        const scrapingStartTime = Date.now();
        try {
          const websiteData = await scrapingDogClient.scrapeWebsite(business.website);
          await metricsClient.trackAPICall(
            campaignId,
            'scrapingdog',
            'website_scrape',
            0.002, // Cost per scrape
            true,
            Date.now() - scrapingStartTime
          );
        } catch (error) {
          await metricsClient.trackAPICall(
            campaignId,
            'scrapingdog',
            'website_scrape',
            0.002,
            false,
            Date.now() - scrapingStartTime
          );
        }
      }
    }

    // Update campaign metrics
    await metricsClient.updateCampaignMetrics(campaignId);

    // Update service health
    await metricsClient.updateServiceHealth(
      'google_places',
      'healthy',
      placesResponseTime,
      0.02, // 2% error rate
      1000, // Rate limit remaining
      500.00 // Budget remaining
    );

    return placesResponse;

  } catch (error) {
    console.error('Enhanced discovery with metrics failed:', error);
    throw error;
  }
};
```

---

### **Phase 4: Export and Excel Integration (Week 7-8)**

#### **Automated Excel Export Service**
```javascript
class ExcelExportService {
  constructor(metricsClient) {
    this.metrics = metricsClient;
  }

  // Generate comprehensive cost analysis for Excel
  async generateCostAnalysisWorkbook(startDate, endDate) {
    const exportData = await this.metrics.generateCostAnalysisExport(startDate, endDate);
    
    // Create Excel workbook structure
    const workbookData = {
      sheets: [
        {
          name: 'Campaign ROI Analysis',
          data: exportData.costAnalysis.map(row => ({
            'Campaign Name': row.campaign_name,
            'Total API Cost': row.total_api_cost,
            'Qualified Leads': row.total_qualified_leads,
            'Cost per Qualified Lead': row.cost_per_qualified_lead,
            'ROI %': row.roi_percentage,
            'Efficiency Rating': row.cost_per_qualified_lead < 0.50 ? 'Excellent' : 
                                 row.cost_per_qualified_lead < 1.00 ? 'Good' : 
                                 row.cost_per_qualified_lead < 2.00 ? 'Fair' : 'Poor'
          }))
        },
        {
          name: 'API Service Breakdown',
          data: this.groupAPIBreakdown(exportData.apiBreakdown)
        },
        {
          name: 'Qualification Trends',
          data: exportData.qualificationTrends.map(row => ({
            'Date': row.date,
            'Qualification Rate %': (row.qualification_rate * 100).toFixed(2),
            'Cost per Qualified Lead': row.cost_per_qualified_lead,
            'Total API Calls': row.total_api_calls,
            'API Efficiency': row.total_api_calls > 0 ? 
              (row.qualification_rate * row.total_api_calls / row.cost_per_qualified_lead).toFixed(2) : 0
          }))
        },
        {
          name: 'Pricing Model Data',
          data: this.generatePricingModelData(exportData)
        }
      ]
    };

    return workbookData;
  }

  groupAPIBreakdown(apiData) {
    const grouped = {};
    apiData.forEach(row => {
      const key = `${row.api_service}_${row.date}`;
      if (!grouped[key]) {
        grouped[key] = {
          'API Service': row.api_service,
          'Date': row.date,
          'Total Cost': 0,
          'Total Requests': 0,
          'Success Rate %': 0,
          'Avg Cost per Request': 0
        };
      }
      grouped[key]['Total Cost'] += row.total_cost;
      grouped[key]['Total Requests'] += row.request_count;
      grouped[key]['Success Rate %'] = ((row.success_count / (row.success_count + row.error_count)) * 100).toFixed(2);
    });
    
    return Object.values(grouped);
  }

  // Generate data specifically for pricing model analysis
  generatePricingModelData(exportData) {
    return [
      {
        'Metric': 'Average Cost per Qualified Lead',
        'Value': exportData.costAnalysis.reduce((sum, row) => sum + row.cost_per_qualified_lead, 0) / exportData.costAnalysis.length,
        'Target': 0.50,
        'Performance': 'Track if under $0.50'
      },
      {
        'Metric': 'Best Performing Campaign Cost',
        'Value': Math.min(...exportData.costAnalysis.map(row => row.cost_per_qualified_lead)),
        'Target': 0.25,
        'Performance': 'Lowest cost per lead'
      },
      {
        'Metric': 'API Cost Distribution',
        'Value': 'See API Service Breakdown sheet',
        'Target': 'Optimize highest cost services',
        'Performance': 'Focus on Hunter.io and ScrapingDog'
      },
      {
        'Metric': 'Qualification Rate Trend',
        'Value': exportData.qualificationTrends[exportData.qualificationTrends.length - 1]?.qualification_rate || 0,
        'Target': 0.80,
        'Performance': 'Target 80%+ qualification rate'
      }
    ];
  }

  // Export to CSV for direct Excel import
  async exportToCSV(workbookData, filename) {
    const csvExports = {};
    
    workbookData.sheets.forEach(sheet => {
      let csvContent = '';
      
      // Add headers
      const headers = Object.keys(sheet.data[0] || {});
      csvContent += headers.join(',') + '\n';
      
      // Add data rows
      sheet.data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        csvContent += values.join(',') + '\n';
      });
      
      csvExports[`${filename}_${sheet.name.replace(/ /g, '_')}.csv`] = csvContent;
    });
    
    return csvExports;
  }
}

// Usage in API endpoint
app.get('/api/export-cost-analysis', async (req, res) => {
  try {
    const { start_date, end_date, format = 'csv' } = req.query;
    
    const metricsClient = new ProspectProMetricsClient(supabase);
    const excelExport = new ExcelExportService(metricsClient);
    
    const workbook = await excelExport.generateCostAnalysisWorkbook(start_date, end_date);
    
    if (format === 'csv') {
      const csvFiles = await excelExport.exportToCSV(workbook, 'ProspectPro_Cost_Analysis');
      
      // Return downloadable CSV files
      res.json({
        success: true,
        files: csvFiles,
        export_timestamp: new Date().toISOString(),
        usage_notes: [
          'Import each CSV into separate Excel sheets',
          'Use Campaign ROI Analysis for pricing model',
          'API Service Breakdown shows cost optimization opportunities',
          'Qualification Trends indicates lead quality over time'
        ]
      });
    }
    
  } catch (error) {
    console.error('Export failed:', error);
    res.status(500).json({ error: 'Export generation failed' });
  }
});
```

---

### **Phase 5: Alternative Tools Integration (Week 9-12)**

#### **Apache Superset Setup (Self-hosted)**
```dockerfile
# docker-compose.yml for Superset
version: '3.8'
services:
  superset:
    image: apache/superset:latest
    container_name: prospectpro-superset
    environment:
      - SUPERSET_CONFIG_PATH=/app/superset_config.py
    ports:
      - "8088:8088"
    volumes:
      - ./superset_config.py:/app/superset_config.py
    depends_on:
      - postgres-superset

  postgres-superset:
    image: postgres:13
    container_name: superset-postgres
    environment:
      POSTGRES_DB: superset
      POSTGRES_USER: superset
      POSTGRES_PASSWORD: superset
    volumes:
      - superset_postgres_data:/var/lib/postgresql/data

volumes:
  superset_postgres_data:
```

```python
# superset_config.py
import os

# PostgreSQL connection to Supabase
SQLALCHEMY_DATABASE_URI = os.environ.get('SUPABASE_DB_URL')

# Enable CSV export
ENABLE_CHUNK_ENCODING = True

# Custom cost analysis queries
CUSTOM_SECURITY_MANAGER = None
FEATURE_FLAGS = {
    "ENABLE_TEMPLATE_PROCESSING": True,
    "DASHBOARD_NATIVE_FILTERS": True
}

# ProspectPro specific dashboard configs
PROSPECTPRO_QUERIES = {
    "cost_per_lead": """
        SELECT 
            campaign_name,
            cost_per_qualified_lead,
            total_qualified_leads,
            roi_percentage
        FROM calculate_cost_per_qualified_lead()
        ORDER BY cost_per_qualified_lead ASC
    """,
    "api_efficiency": """
        SELECT 
            api_service,
            DATE_TRUNC('day', date) as day,
            SUM(total_cost) as daily_cost,
            SUM(request_count) as daily_requests,
            AVG(CASE WHEN success_count > 0 THEN success_count::float / request_count ELSE 0 END) * 100 as success_rate
        FROM api_cost_tracking 
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY api_service, DATE_TRUNC('day', date)
        ORDER BY day DESC
    """
}
```

#### **Dashibase Setup (Supabase-specific)**
```javascript
// dashibaseConfig.ts for ProspectPro
export const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  
  pages: [
    {
      name: "Campaign Analytics",
      url: "/campaigns",
      table: "campaigns",
      view: "list",
      columns: [
        { name: "name", type: "text", required: true },
        { name: "total_cost", type: "number", format: "currency" },
        { name: "leads_discovered", type: "number" },
        { name: "leads_qualified", type: "number" },
        { name: "status", type: "text" }
      ],
      actions: ["create", "read", "update"],
      filters: ["status", "total_cost"]
    },
    {
      name: "Cost Tracking",
      url: "/costs",
      table: "api_cost_tracking",
      view: "table",
      columns: [
        { name: "api_service", type: "text" },
        { name: "date", type: "date" },
        { name: "total_cost", type: "number", format: "currency" },
        { name: "request_count", type: "number" },
        { name: "success_count", type: "number" },
        { name: "avg_response_time_ms", type: "number" }
      ],
      actions: ["read"],
      aggregations: {
        "total_cost": "sum",
        "request_count": "sum"
      }
    },
    {
      name: "Lead Quality Metrics",
      url: "/quality",
      table: "lead_qualification_metrics", 
      view: "card",
      columns: [
        { name: "date", type: "date" },
        { name: "qualification_rate", type: "number", format: "percentage" },
        { name: "cost_per_qualified_lead", type: "number", format: "currency" },
        { name: "total_api_calls", type: "number" }
      ],
      charts: [
        {
          type: "line",
          x: "date", 
          y: "qualification_rate",
          title: "Qualification Rate Trend"
        },
        {
          type: "bar",
          x: "date",
          y: "cost_per_qualified_lead", 
          title: "Cost Efficiency"
        }
      ]
    }
  ],
  
  theme: {
    primaryColor: "#3B82F6",
    backgroundColor: "#F8FAFC"
  }
};
```

---

## 💰 Cost Analysis

### **Free Tier Capabilities**

| Tool | Free Tier | Cost Tracking | Excel Export | API Monitoring |
|------|-----------|---------------|--------------|----------------|
| **Grafana Cloud** | 3 users, 10K metrics | ✅ Excellent | ✅ CSV/Excel | ✅ Native templates |
| **Apache Superset** | Self-hosted only | ✅ SQL-based | ✅ Multiple formats | ✅ Custom dashboards |
| **Dashibase** | Open source | ⚠️ Basic | ❌ Limited | ⚠️ CRUD only |
| **Supabase Native** | Included | ⚠️ Basic | ❌ No | ✅ DB metrics only |

### **Recommended Stack Total Cost: $0-25/month**
- **Grafana Cloud Free**: $0 (sufficient for your needs)
- **Supabase Pro**: $25/month (already required)
- **Self-hosted Superset**: $0 (optional for advanced analytics)
- **Railway hosting**: $0-5/month (existing requirement)

---

## 🎯 Success Metrics & KPIs

### **Key Dashboard Metrics to Track**

1. **Cost per Qualified Lead** (Primary KPI)
   - Target: <$0.50 per qualified lead
   - Alert: >$1.00 per qualified lead

2. **API Service ROI**
   - Hunter.io: Email discovery rate vs. cost
   - ScrapingDog: Data enrichment quality vs. cost
   - Google Places: Lead volume vs. cost

3. **Campaign Efficiency**
   - Qualification rate: Target 80%+
   - API call optimization: Minimize unnecessary calls
   - Service uptime: 99.9% availability

4. **Budget Management**
   - Daily spend tracking
   - Service quota monitoring
   - Cost per lead trending

### **Excel Pricing Model Framework**
The dashboard exports will provide data for Excel analysis including:
- **Historical cost trends** for pricing model adjustments
- **Service efficiency metrics** for cost optimization
- **Campaign ROI analysis** for customer value demonstration
- **Qualification rate trends** for quality improvement

This integrated dashboard system transforms ProspectPro from a basic lead generator into a data-driven platform with comprehensive cost tracking, real-time monitoring, and exportable analytics for strategic pricing decisions.