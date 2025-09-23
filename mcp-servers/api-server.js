#!/usr/bin/env node

/**
 * ProspectPro API MCP Server
 * Provides AI access to external API clients and testing capabilities
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const path = require("path");

class ProspectProAPIServer {
  constructor() {
    this.server = new Server(
      {
        name: "prospectpro-apis",
        version: "1.0.0",
        description:
          "ProspectPro API MCP Server - AI access to external API clients",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.apiClients = {};
    this.setupHandlers();
  }

  async initializeAPIClients() {
    try {
      // Load API clients dynamically
      const GooglePlacesClient = require("../modules/api-clients/google-places-client");
      const FoursquareClient = require("../modules/api-clients/foursquare-places-client");
      const HunterIOClient = require("../modules/api-clients/hunter-io-client");
      const NeverBounceClient = require("../modules/api-clients/neverbounce-client");

      this.apiClients = {
        googlePlaces: new GooglePlacesClient(process.env.GOOGLE_PLACES_API_KEY),
        foursquare: new FoursquareClient(process.env.FOURSQUARE_API_KEY),
        hunterIO: new HunterIOClient(process.env.HUNTER_IO_API_KEY),
        neverBounce: new NeverBounceClient(process.env.NEVERBOUNCE_API_KEY),
      };
    } catch (error) {
      console.error(
        "Warning: Some API clients could not be loaded:",
        error.message
      );
      this.apiClients = {};
    }
  }

  setupHandlers() {
    // Tool definitions
    this.server.setRequestHandler("tools/list", async () => ({
      tools: [
        {
          name: "test_google_places",
          description: "Test Google Places API with a sample query",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query for businesses",
              },
              location: {
                type: "string",
                description: "Location to search in",
                default: "New York, NY",
              },
              limit: {
                type: "number",
                description: "Number of results to return",
                default: 5,
              },
            },
            required: ["query"],
          },
        },
        {
          name: "test_foursquare_places",
          description: "Test Foursquare Places API with a sample query",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query for businesses",
              },
              location: {
                type: "string",
                description: "Location to search in",
                default: "New York, NY",
              },
              limit: {
                type: "number",
                description: "Number of results to return",
                default: 5,
              },
            },
            required: ["query"],
          },
        },
        {
          name: "test_email_discovery",
          description: "Test Hunter.io email discovery for a domain",
          inputSchema: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Domain to search for emails",
              },
              limit: {
                type: "number",
                description: "Number of emails to return",
                default: 5,
              },
            },
            required: ["domain"],
          },
        },
        {
          name: "verify_email",
          description: "Verify email deliverability using NeverBounce",
          inputSchema: {
            type: "object",
            properties: {
              email: {
                type: "string",
                description: "Email address to verify",
              },
            },
            required: ["email"],
          },
        },
        {
          name: "get_api_usage_stats",
          description: "Get usage statistics for all API clients",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "simulate_lead_discovery",
          description:
            "Simulate the full lead discovery process with real API calls",
          inputSchema: {
            type: "object",
            properties: {
              businessType: {
                type: "string",
                description: "Type of business to search for",
              },
              location: {
                type: "string",
                description: "Location to search in",
              },
              maxResults: {
                type: "number",
                description: "Maximum number of leads to discover",
                default: 3,
              },
            },
            required: ["businessType", "location"],
          },
        },
      ],
    }));

    // Tool execution handlers
    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      try {
        await this.initializeAPIClients();

        switch (name) {
          case "test_google_places":
            return await this.testGooglePlaces(args);
          case "test_foursquare_places":
            return await this.testFoursquarePlaces(args);
          case "test_email_discovery":
            return await this.testEmailDiscovery(args);
          case "verify_email":
            return await this.verifyEmail(args);
          case "get_api_usage_stats":
            return await this.getAPIUsageStats();
          case "simulate_lead_discovery":
            return await this.simulateLeadDiscovery(args);
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
          uri: "apis://google-places/config",
          name: "Google Places API Configuration",
          description: "Configuration and status of Google Places API client",
          mimeType: "application/json",
        },
        {
          uri: "apis://foursquare/config",
          name: "Foursquare API Configuration",
          description: "Configuration and status of Foursquare API client",
          mimeType: "application/json",
        },
        {
          uri: "apis://hunter-io/config",
          name: "Hunter.io API Configuration",
          description: "Configuration and status of Hunter.io API client",
          mimeType: "application/json",
        },
        {
          uri: "apis://neverbounce/config",
          name: "NeverBounce API Configuration",
          description: "Configuration and status of NeverBounce API client",
          mimeType: "application/json",
        },
      ],
    }));
  }

  async testGooglePlaces(args) {
    const { query, location = "New York, NY", limit = 5 } = args;

    if (!this.apiClients.googlePlaces) {
      throw new Error("Google Places API client not available");
    }

    const results = await this.apiClients.googlePlaces.searchBusinesses(
      query,
      location,
      limit
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              api: "Google Places",
              query,
              location,
              results: results.businesses || [],
              success: results.found,
              error: results.error || null,
              usage_stats: this.apiClients.googlePlaces.getUsageStats(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async testFoursquarePlaces(args) {
    const { query, location = "New York, NY", limit = 5 } = args;

    if (!this.apiClients.foursquare) {
      throw new Error("Foursquare API client not available");
    }

    const results = await this.apiClients.foursquare.searchBusinesses(
      query,
      location,
      limit
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              api: "Foursquare Places",
              query,
              location,
              results: results.businesses || [],
              success: results.found,
              error: results.error || null,
              usage_stats: this.apiClients.foursquare.getUsageStats(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async testEmailDiscovery(args) {
    const { domain, limit = 5 } = args;

    if (!this.apiClients.hunterIO) {
      throw new Error("Hunter.io API client not available");
    }

    const results = await this.apiClients.hunterIO.findEmails(domain, limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              api: "Hunter.io",
              domain,
              emails: results.emails || [],
              success: results.found,
              error: results.error || null,
              usage_stats: this.apiClients.hunterIO.getUsageStats(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async verifyEmail(args) {
    const { email } = args;

    if (!this.apiClients.neverBounce) {
      throw new Error("NeverBounce API client not available");
    }

    const result = await this.apiClients.neverBounce.verifyEmail(email);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              api: "NeverBounce",
              email,
              verification: result,
              usage_stats: this.apiClients.neverBounce.getUsageStats(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getAPIUsageStats() {
    const stats = {};

    Object.entries(this.apiClients).forEach(([name, client]) => {
      if (client && typeof client.getUsageStats === "function") {
        stats[name] = client.getUsageStats();
      }
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              api_usage_statistics: stats,
              generated_at: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async simulateLeadDiscovery(args) {
    const { businessType, location, maxResults = 3 } = args;

    const results = {
      businessType,
      location,
      maxResults,
      discovery_results: {},
      processing_summary: {
        total_discovered: 0,
        processing_stages: {},
        errors: [],
      },
    };

    try {
      // Stage 1: Business Discovery
      if (this.apiClients.foursquare) {
        const foursquareResults =
          await this.apiClients.foursquare.searchBusinesses(
            businessType,
            location,
            maxResults
          );
        results.discovery_results.foursquare = foursquareResults;
        results.processing_summary.total_discovered +=
          foursquareResults.businesses?.length || 0;
      }

      if (this.apiClients.googlePlaces) {
        const googleResults =
          await this.apiClients.googlePlaces.searchBusinesses(
            businessType,
            location,
            maxResults
          );
        results.discovery_results.google_places = googleResults;
        results.processing_summary.total_discovered +=
          googleResults.businesses?.length || 0;
      }

      // Stage 2: Email Discovery (sample with first business)
      const sampleBusiness =
        results.discovery_results.foursquare?.businesses?.[0] ||
        results.discovery_results.google_places?.businesses?.[0];

      if (
        sampleBusiness &&
        sampleBusiness.website &&
        this.apiClients.hunterIO
      ) {
        const domain = new URL(sampleBusiness.website).hostname;
        const emailResults = await this.apiClients.hunterIO.findEmails(
          domain,
          2
        );
        results.discovery_results.email_discovery = emailResults;

        // Stage 3: Email Verification (sample)
        if (
          emailResults.emails &&
          emailResults.emails.length > 0 &&
          this.apiClients.neverBounce
        ) {
          const emailVerification =
            await this.apiClients.neverBounce.verifyEmail(
              emailResults.emails[0].email
            );
          results.discovery_results.email_verification = emailVerification;
        }
      }

      // Compile usage statistics
      results.api_usage = {};
      Object.entries(this.apiClients).forEach(([name, client]) => {
        if (client && typeof client.getUsageStats === "function") {
          results.api_usage[name] = client.getUsageStats();
        }
      });
    } catch (error) {
      results.processing_summary.errors.push(error.message);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("ProspectPro API MCP Server running...");
  }
}

// Start the server
if (require.main === module) {
  const server = new ProspectProAPIServer();
  server.run().catch((error) => {
    console.error("Failed to start API server:", error);
    process.exit(1);
  });
}

module.exports = ProspectProAPIServer;
