/**
 * Dashboard Export API Endpoints
 * CSV/Excel export functionality for monitoring dashboards
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Robust import for Railway deployment compatibility
let ProspectProMetricsClient;
try {
  ProspectProMetricsClient = require('../modules/api-clients/prospectpro-metrics-client');
} catch (error) {
  console.error('Failed to import with relative path, trying absolute path...', error.message);
  try {
    const absolutePath = path.resolve(__dirname, '..', 'modules', 'api-clients', 'prospectpro-metrics-client');
    ProspectProMetricsClient = require(absolutePath);
  } catch (absoluteError) {
    console.error('Failed to import with absolute path:', absoluteError.message);
    throw new Error('Cannot import ProspectProMetricsClient: ' + absoluteError.message);
  }
}

class DashboardExportService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.metricsClient = new ProspectProMetricsClient(supabaseClient);
  }

  /**
   * Generate CSV content from JSON data
   */
  generateCSVContent(data, headers) {
    if (!data || data.length === 0) {
      return headers.join(',') + '\n';
    }

    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => {
      return headers.map(header => {
        let value = row[header] || '';
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });

    return csvHeaders + '\n' + csvRows.join('\n');
  }

  /**
   * Export campaign performance data
   */
  async exportCampaignPerformance(startDate, endDate, campaignIds = null, format = 'csv') {
    try {
      const exportData = await this.metricsClient.prepareDashboardExport(
        'campaign_performance', 
        startDate, 
        endDate, 
        campaignIds
      );

      if (!exportData || !exportData.campaigns) {
        throw new Error('No campaign data available for export');
      }

      const headers = [
        'campaign_id',
        'name', 
        'status',
        'created_at',
        'total_leads',
        'qualified_leads',
        'qualification_rate',
        'total_cost',
        'cost_per_lead',
        'avg_confidence_score',
        'roi_estimate'
      ];

      const transformedData = exportData.campaigns.map(campaign => ({
        campaign_id: campaign.campaign_id,
        name: campaign.name,
        status: campaign.status,
        created_at: new Date(campaign.created_at).toLocaleDateString(),
        total_leads: campaign.total_leads,
        qualified_leads: campaign.qualified_leads,
        qualification_rate: campaign.qualified_leads > 0 ? 
          ((campaign.qualified_leads / campaign.total_leads) * 100).toFixed(1) + '%' : '0%',
        total_cost: '$' + parseFloat(campaign.total_cost || 0).toFixed(2),
        cost_per_lead: campaign.total_leads > 0 ? 
          '$' + (parseFloat(campaign.total_cost || 0) / campaign.total_leads).toFixed(2) : '$0.00',
        avg_confidence_score: campaign.avg_confidence_score || 0,
        roi_estimate: campaign.qualified_leads > 0 ? 
          '$' + ((campaign.qualified_leads * 10.00) - parseFloat(campaign.total_cost || 0)).toFixed(2) : '$0.00'
      }));

      if (format === 'csv') {
        return {
          content: this.generateCSVContent(transformedData, headers),
          filename: `ProspectPro_Campaign_Performance_${startDate}_to_${endDate}.csv`,
          contentType: 'text/csv'
        };
      }

      return {
        content: JSON.stringify(transformedData, null, 2),
        filename: `ProspectPro_Campaign_Performance_${startDate}_to_${endDate}.json`,
        contentType: 'application/json'
      };

    } catch (error) {
      console.error('Campaign performance export failed:', error);
      throw error;
    }
  }

  /**
   * Export cost analysis data
   */
  async exportCostAnalysis(startDate, endDate, campaignIds = null, format = 'csv') {
    try {
      const [costAnalytics, apiBreakdown] = await Promise.all([
        this.metricsClient.getCostAnalytics(null, startDate, endDate),
        this.metricsClient.getAPIServiceBreakdown(startDate, endDate)
      ]);

      if (!costAnalytics && !apiBreakdown) {
        throw new Error('No cost data available for export');
      }

      // Export 1: Campaign Cost Analysis
      const campaignHeaders = [
        'campaign_name',
        'total_qualified_leads',
        'total_api_cost',
        'cost_per_qualified_lead',
        'roi_percentage',
        'efficiency_score',
        'trend_direction'
      ];

      const campaignData = (costAnalytics || []).map(campaign => ({
        campaign_name: campaign.campaign_name,
        total_qualified_leads: campaign.total_qualified_leads,
        total_api_cost: '$' + parseFloat(campaign.total_api_cost || 0).toFixed(4),
        cost_per_qualified_lead: '$' + parseFloat(campaign.cost_per_qualified_lead || 0).toFixed(4),
        roi_percentage: parseFloat(campaign.roi_percentage || 0).toFixed(1) + '%',
        efficiency_score: campaign.efficiency_score || 0,
        trend_direction: campaign.trend_direction || 'stable'
      }));

      // Export 2: API Service Breakdown
      const apiHeaders = [
        'api_service',
        'total_requests',
        'total_cost',
        'cost_per_request',
        'success_rate',
        'avg_response_time_ms',
        'trend_7day'
      ];

      const apiData = (apiBreakdown || []).map(api => ({
        api_service: api.api_service,
        total_requests: api.total_requests,
        total_cost: '$' + parseFloat(api.total_cost || 0).toFixed(4),
        cost_per_request: '$' + parseFloat(api.cost_per_request || 0).toFixed(4),
        success_rate: parseFloat(api.success_rate || 0).toFixed(1) + '%',
        avg_response_time_ms: api.avg_response_time_ms || 0,
        trend_7day: api.trend_7day || 'stable'
      }));

      if (format === 'csv') {
        const campaignCSV = this.generateCSVContent(campaignData, campaignHeaders);
        const apiCSV = this.generateCSVContent(apiData, apiHeaders);
        
        return {
          content: {
            'Campaign_Cost_Analysis.csv': campaignCSV,
            'API_Service_Breakdown.csv': apiCSV
          },
          filename: `ProspectPro_Cost_Analysis_${startDate}_to_${endDate}`,
          contentType: 'application/zip',
          multipleFiles: true
        };
      }

      return {
        content: JSON.stringify({
          campaign_analysis: campaignData,
          api_breakdown: apiData,
          export_metadata: {
            start_date: startDate,
            end_date: endDate,
            generated_at: new Date().toISOString()
          }
        }, null, 2),
        filename: `ProspectPro_Cost_Analysis_${startDate}_to_${endDate}.json`,
        contentType: 'application/json'
      };

    } catch (error) {
      console.error('Cost analysis export failed:', error);
      throw error;
    }
  }

  /**
   * Export real-time dashboard data
   */
  async exportDashboardSnapshot(format = 'csv') {
    try {
      const dashboardMetrics = await this.metricsClient.getDashboardMetrics();
      
      if (!dashboardMetrics) {
        throw new Error('No dashboard data available');
      }

      // Overview metrics
      const overviewHeaders = ['metric', 'value'];
      const overviewData = [
        { metric: 'Active Campaigns', value: dashboardMetrics.overview.active_campaigns },
        { metric: 'Total Leads Today', value: dashboardMetrics.overview.total_leads_today },
        { metric: 'Qualified Leads Today', value: dashboardMetrics.overview.qualified_leads_today },
        { metric: 'Total Cost Today', value: '$' + parseFloat(dashboardMetrics.overview.total_cost_today || 0).toFixed(2) },
        { metric: 'Avg Qualification Rate', value: parseFloat(dashboardMetrics.overview.avg_qualification_rate || 0).toFixed(1) + '%' }
      ];

      // Service health metrics
      const serviceHeaders = ['service_name', 'status', 'response_time_ms', 'error_rate', 'rate_limit_remaining', 'cost_budget_remaining', 'requests_today'];
      const serviceData = Object.entries(dashboardMetrics.service_health || {}).map(([service, health]) => ({
        service_name: service,
        status: health.status,
        response_time_ms: health.response_time_ms || 0,
        error_rate: parseFloat(health.error_rate || 0).toFixed(2) + '%',
        rate_limit_remaining: health.rate_limit_remaining || 0,
        cost_budget_remaining: '$' + parseFloat(health.cost_budget_remaining || 0).toFixed(2),
        requests_today: health.requests_today || 0
      }));

      // Hourly performance
      const hourlyHeaders = ['hour', 'total_requests', 'total_cost', 'success_rate', 'avg_response_time'];
      const hourlyData = (dashboardMetrics.hourly_performance || []).map(hour => ({
        hour: hour.hour + ':00',
        total_requests: hour.total_requests,
        total_cost: '$' + parseFloat(hour.total_cost || 0).toFixed(2),
        success_rate: parseFloat(hour.success_rate || 0).toFixed(1) + '%',
        avg_response_time: hour.avg_response_time || 0
      }));

      if (format === 'csv') {
        const overviewCSV = this.generateCSVContent(overviewData, overviewHeaders);
        const serviceCSV = this.generateCSVContent(serviceData, serviceHeaders);
        const hourlyCSV = this.generateCSVContent(hourlyData, hourlyHeaders);
        
        return {
          content: {
            'Dashboard_Overview.csv': overviewCSV,
            'Service_Health.csv': serviceCSV,
            'Hourly_Performance.csv': hourlyCSV
          },
          filename: `ProspectPro_Dashboard_Snapshot_${new Date().toISOString().split('T')[0]}`,
          contentType: 'application/zip',
          multipleFiles: true
        };
      }

      return {
        content: JSON.stringify({
          overview: overviewData,
          service_health: serviceData,
          hourly_performance: hourlyData,
          snapshot_time: new Date().toISOString()
        }, null, 2),
        filename: `ProspectPro_Dashboard_Snapshot_${new Date().toISOString().split('T')[0]}.json`,
        contentType: 'application/json'
      };

    } catch (error) {
      console.error('Dashboard snapshot export failed:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive ROI report for pricing model analysis
   */
  async exportROIAnalysis(startDate, endDate, format = 'csv') {
    try {
      const [costAnalytics, apiBreakdown, exportData] = await Promise.all([
        this.metricsClient.getCostAnalytics(null, startDate, endDate),
        this.metricsClient.getAPIServiceBreakdown(startDate, endDate),
        this.metricsClient.prepareDashboardExport('cost_analysis', startDate, endDate)
      ]);

      // ROI Summary
      const totalCost = (costAnalytics || []).reduce((sum, campaign) => 
        sum + parseFloat(campaign.total_api_cost || 0), 0);
      const totalQualifiedLeads = (costAnalytics || []).reduce((sum, campaign) => 
        sum + parseInt(campaign.total_qualified_leads || 0), 0);
      const avgCostPerLead = totalQualifiedLeads > 0 ? totalCost / totalQualifiedLeads : 0;
      const estimatedRevenue = totalQualifiedLeads * 10.00; // Assuming $10 per qualified lead
      const netROI = estimatedRevenue - totalCost;
      const roiPercentage = totalCost > 0 ? (netROI / totalCost) * 100 : 0;

      const roiHeaders = ['metric', 'value', 'notes'];
      const roiData = [
        { metric: 'Date Range', value: `${startDate} to ${endDate}`, notes: 'Analysis period' },
        { metric: 'Total API Cost', value: '$' + totalCost.toFixed(2), notes: 'All API services combined' },
        { metric: 'Total Qualified Leads', value: totalQualifiedLeads, notes: 'Leads with 80%+ confidence score' },
        { metric: 'Avg Cost Per Qualified Lead', value: '$' + avgCostPerLead.toFixed(2), notes: 'Key efficiency metric' },
        { metric: 'Estimated Revenue', value: '$' + estimatedRevenue.toFixed(2), notes: 'Assuming $10 per qualified lead' },
        { metric: 'Net ROI', value: '$' + netROI.toFixed(2), notes: 'Revenue minus costs' },
        { metric: 'ROI Percentage', value: roiPercentage.toFixed(1) + '%', notes: 'Return on investment' },
        { metric: 'Break-even Point', value: (totalCost / 10.00).toFixed(0) + ' leads', notes: 'Leads needed to break even' }
      ];

      // Daily trends from export data
      const dailyTrends = (exportData?.daily_trends || []).map(day => ({
        date: day.date,
        total_cost: '$' + parseFloat(day.total_cost || 0).toFixed(2),
        total_requests: day.total_requests,
        qualified_leads: day.qualified_leads,
        cost_per_lead: day.qualified_leads > 0 ? 
          '$' + (parseFloat(day.total_cost || 0) / day.qualified_leads).toFixed(2) : '$0.00',
        daily_roi: '$' + ((day.qualified_leads * 10.00) - parseFloat(day.total_cost || 0)).toFixed(2)
      }));

      const trendHeaders = ['date', 'total_cost', 'total_requests', 'qualified_leads', 'cost_per_lead', 'daily_roi'];

      if (format === 'csv') {
        const roiCSV = this.generateCSVContent(roiData, roiHeaders);
        const trendsCSV = this.generateCSVContent(dailyTrends, trendHeaders);
        
        return {
          content: {
            'ROI_Analysis_Summary.csv': roiCSV,
            'Daily_ROI_Trends.csv': trendsCSV
          },
          filename: `ProspectPro_ROI_Analysis_${startDate}_to_${endDate}`,
          contentType: 'application/zip',
          multipleFiles: true
        };
      }

      return {
        content: JSON.stringify({
          roi_summary: roiData,
          daily_trends: dailyTrends,
          analysis_metadata: {
            total_campaigns: (costAnalytics || []).length,
            analysis_period: `${startDate} to ${endDate}`,
            generated_at: new Date().toISOString()
          }
        }, null, 2),
        filename: `ProspectPro_ROI_Analysis_${startDate}_to_${endDate}.json`,
        contentType: 'application/json'
      };

    } catch (error) {
      console.error('ROI analysis export failed:', error);
      throw error;
    }
  }
}

/**
 * Express.js API Routes for Dashboard Exports
 */
function createDashboardExportRoutes(supabaseClient) {
  const router = express.Router();
  const exportService = new DashboardExportService(supabaseClient);

  // Export campaign performance
  router.get('/export/campaigns', async (req, res) => {
    try {
      const { start_date, end_date, campaign_ids, format = 'csv' } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          error: 'start_date and end_date are required' 
        });
      }

      const campaignIdsArray = campaign_ids ? campaign_ids.split(',') : null;
      const exportResult = await exportService.exportCampaignPerformance(
        start_date, end_date, campaignIdsArray, format
      );

      // Log the export
      await exportService.metricsClient.logDashboardExport(
        req.user?.id || 'system',
        'campaign_performance',
        format,
        start_date,
        end_date,
        campaignIdsArray,
        exportResult.content.split('\n').length - 1,
        Buffer.byteLength(exportResult.content, 'utf8') / (1024 * 1024)
      );

      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      res.send(exportResult.content);

    } catch (error) {
      console.error('Campaign export error:', error);
      res.status(500).json({ error: 'Export failed: ' + error.message });
    }
  });

  // Export cost analysis
  router.get('/export/costs', async (req, res) => {
    try {
      const { start_date, end_date, campaign_ids, format = 'csv' } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          error: 'start_date and end_date are required' 
        });
      }

      const campaignIdsArray = campaign_ids ? campaign_ids.split(',') : null;
      const exportResult = await exportService.exportCostAnalysis(
        start_date, end_date, campaignIdsArray, format
      );

      await exportService.metricsClient.logDashboardExport(
        req.user?.id || 'system',
        'cost_analysis',
        format,
        start_date,
        end_date,
        campaignIdsArray,
        Object.keys(exportResult.content).length,
        0.5 // Estimated size for multi-file exports
      );

      if (exportResult.multipleFiles) {
        // For multiple files, return as JSON with file contents
        res.setHeader('Content-Type', 'application/json');
        res.json({
          files: exportResult.content,
          filename: exportResult.filename,
          export_type: 'multi_file'
        });
      } else {
        res.setHeader('Content-Type', exportResult.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
        res.send(exportResult.content);
      }

    } catch (error) {
      console.error('Cost analysis export error:', error);
      res.status(500).json({ error: 'Export failed: ' + error.message });
    }
  });

  // Export dashboard snapshot
  router.get('/export/snapshot', async (req, res) => {
    try {
      const { format = 'csv' } = req.query;
      
      const exportResult = await exportService.exportDashboardSnapshot(format);

      await exportService.metricsClient.logDashboardExport(
        req.user?.id || 'system',
        'dashboard_snapshot',
        format,
        new Date().toISOString().split('T')[0],
        new Date().toISOString().split('T')[0],
        null,
        exportResult.multipleFiles ? Object.keys(exportResult.content).length : 1,
        0.1 // Small snapshot
      );

      if (exportResult.multipleFiles) {
        res.setHeader('Content-Type', 'application/json');
        res.json({
          files: exportResult.content,
          filename: exportResult.filename,
          export_type: 'multi_file'
        });
      } else {
        res.setHeader('Content-Type', exportResult.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
        res.send(exportResult.content);
      }

    } catch (error) {
      console.error('Dashboard snapshot export error:', error);
      res.status(500).json({ error: 'Export failed: ' + error.message });
    }
  });

  // Export ROI analysis
  router.get('/export/roi', async (req, res) => {
    try {
      const { start_date, end_date, format = 'csv' } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          error: 'start_date and end_date are required' 
        });
      }

      const exportResult = await exportService.exportROIAnalysis(
        start_date, end_date, format
      );

      await exportService.metricsClient.logDashboardExport(
        req.user?.id || 'system',
        'roi_report',
        format,
        start_date,
        end_date,
        null,
        Object.keys(exportResult.content).length,
        0.3
      );

      if (exportResult.multipleFiles) {
        res.setHeader('Content-Type', 'application/json');
        res.json({
          files: exportResult.content,
          filename: exportResult.filename,
          export_type: 'multi_file'
        });
      } else {
        res.setHeader('Content-Type', exportResult.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
        res.send(exportResult.content);
      }

    } catch (error) {
      console.error('ROI analysis export error:', error);
      res.status(500).json({ error: 'Export failed: ' + error.message });
    }
  });

  return router;
}

module.exports = { 
  DashboardExportService, 
  createDashboardExportRoutes 
};