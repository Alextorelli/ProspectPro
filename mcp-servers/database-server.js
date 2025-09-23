#!/usr/bin/env node

/**
 * ProspectPro Database MCP Server
 * Provides AI access to Supabase database for lead analysis and management
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const { createClient } = require("@supabase/supabase-js");

class ProspectProDatabaseServer {
  constructor() {
    this.server = new Server(
      {
        name: "prospectpro-database",
        version: "1.0.0",
        description:
          "ProspectPro Database MCP Server - AI access to lead data and analytics",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.supabase = null;
    this.setupHandlers();
  }

  async initializeSupabase() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );

    // Test connection
    const { data, error } = await this.supabase
      .from("enhanced_leads")
      .select("count")
      .limit(1);

    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
  }

  setupHandlers() {
    // Tool definitions
    this.server.setRequestHandler("tools/list", async () => ({
      tools: [
        {
          name: "query_leads",
          description: "Query enhanced_leads table with filters and analytics",
          inputSchema: {
            type: "object",
            properties: {
              filters: {
                type: "object",
                description: "SQL WHERE clause conditions",
              },
              limit: {
                type: "number",
                description: "Number of results to return",
                default: 10,
              },
              orderBy: {
                type: "string",
                description: "Column to order results by",
                default: "confidence_score",
              },
            },
          },
        },
        {
          name: "get_campaign_stats",
          description: "Get campaign statistics and performance metrics",
          inputSchema: {
            type: "object",
            properties: {
              campaignId: {
                type: "string",
                description: "Campaign ID to analyze",
              },
              timeRange: {
                type: "string",
                description: "Time range for analysis (24h, 7d, 30d)",
                default: "24h",
              },
            },
          },
        },
        {
          name: "analyze_lead_quality",
          description: "Analyze lead quality patterns and scoring distribution",
          inputSchema: {
            type: "object",
            properties: {
              businessType: {
                type: "string",
                description: "Filter by business type/industry",
              },
              minConfidence: {
                type: "number",
                description: "Minimum confidence score threshold",
                default: 70,
              },
            },
          },
        },
        {
          name: "get_api_costs",
          description: "Retrieve API cost breakdown and budget analysis",
          inputSchema: {
            type: "object",
            properties: {
              timeRange: {
                type: "string",
                description: "Time range for cost analysis",
                default: "24h",
              },
            },
          },
        },
      ],
    }));

    // Tool execution handlers
    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      try {
        await this.initializeSupabase();

        switch (name) {
          case "query_leads":
            return await this.queryLeads(args);
          case "get_campaign_stats":
            return await this.getCampaignStats(args);
          case "analyze_lead_quality":
            return await this.analyzeLeadQuality(args);
          case "get_api_costs":
            return await this.getApiCosts(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // Resource handlers
    this.server.setRequestHandler("resources/list", async () => ({
      resources: [
        {
          uri: "database://enhanced_leads",
          name: "Enhanced Leads Table",
          description:
            "Main table containing processed and validated business leads",
          mimeType: "application/json",
        },
        {
          uri: "database://campaigns",
          name: "Campaigns Table",
          description: "Campaign tracking and performance data",
          mimeType: "application/json",
        },
        {
          uri: "database://api_costs",
          name: "API Costs Table",
          description: "API usage and cost tracking data",
          mimeType: "application/json",
        },
      ],
    }));
  }

  async queryLeads(args) {
    const { filters = {}, limit = 10, orderBy = "confidence_score" } = args;

    let query = this.supabase
      .from("enhanced_leads")
      .select("*")
      .order(orderBy, { ascending: false })
      .limit(limit);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Query failed: ${error.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              results: data,
              count: data.length,
              query_info: {
                filters,
                limit,
                orderBy,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getCampaignStats(args) {
    const { campaignId, timeRange = "24h" } = args;

    // Convert time range to SQL interval
    const intervalMap = {
      "24h": "1 day",
      "7d": "7 days",
      "30d": "30 days",
    };

    const { data, error } = await this.supabase.rpc("get_campaign_statistics", {
      p_campaign_id: campaignId,
      p_time_interval: intervalMap[timeRange] || "1 day",
    });

    if (error) {
      throw new Error(`Campaign stats query failed: ${error.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              campaign_id: campaignId,
              time_range: timeRange,
              statistics: data,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async analyzeLeadQuality(args) {
    const { businessType, minConfidence = 70 } = args;

    let query = this.supabase
      .from("enhanced_leads")
      .select(
        "confidence_score, business_name, email_confidence, phone_confidence, website_confidence"
      )
      .gte("confidence_score", minConfidence);

    if (businessType) {
      query = query.ilike("business_type", `%${businessType}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Quality analysis failed: ${error.message}`);
    }

    // Calculate quality metrics
    const analysis = {
      total_leads: data.length,
      average_confidence:
        data.reduce((sum, lead) => sum + lead.confidence_score, 0) /
        data.length,
      confidence_distribution: {
        high: data.filter((l) => l.confidence_score >= 85).length,
        medium: data.filter(
          (l) => l.confidence_score >= 70 && l.confidence_score < 85
        ).length,
        low: data.filter((l) => l.confidence_score < 70).length,
      },
      contact_quality: {
        strong_email: data.filter((l) => l.email_confidence >= 80).length,
        strong_phone: data.filter((l) => l.phone_confidence >= 80).length,
        strong_website: data.filter((l) => l.website_confidence >= 80).length,
      },
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }

  async getApiCosts(args) {
    const { timeRange = "24h" } = args;

    const intervalMap = {
      "24h": "1 day",
      "7d": "7 days",
      "30d": "30 days",
    };

    const { data, error } = await this.supabase
      .from("api_costs")
      .select("*")
      .gte("created_at", `now() - interval '${intervalMap[timeRange]}'`)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`API costs query failed: ${error.message}`);
    }

    // Aggregate costs by API
    const costBreakdown = data.reduce((acc, record) => {
      const api = record.api_name;
      if (!acc[api]) {
        acc[api] = { requests: 0, total_cost: 0 };
      }
      acc[api].requests += 1;
      acc[api].total_cost += record.cost;
      return acc;
    }, {});

    const totalCost = Object.values(costBreakdown).reduce(
      (sum, api) => sum + api.total_cost,
      0
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              time_range: timeRange,
              total_cost: totalCost,
              cost_breakdown: costBreakdown,
              total_requests: data.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("ProspectPro Database MCP Server running...");
  }
}

// Start the server
if (require.main === module) {
  const server = new ProspectProDatabaseServer();
  server.run().catch((error) => {
    console.error("Failed to start database server:", error);
    process.exit(1);
  });
}

module.exports = ProspectProDatabaseServer;
