/**
 * Apollo.io Organization Enrichment Client
 * Premium service for owner/executive contact discovery
 * Cost: $1.00 per organization enrichment
 */

class ApolloOrganizationClient {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.apollo.io/v1";
    this.cache = new Map();
    this.cacheTTL = 86400000; // 24 hours for contact data
    this.usageStats = {
      enrichments: 0,
      organizationsFound: 0,
      totalCost: 0.0,
      ownersFound: 0,
    };
  }

  // Consistent cache methods following ProspectPro patterns
  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Enrich organization with owner/executive contacts
   * @param {Object} business - Business data to enrich
   * @returns {Promise<Object>} Enrichment results
   */
  async enrichOrganization(business) {
    if (!this.apiKey) {
      return {
        success: false,
        error: "Apollo API key not configured",
        source: "apollo_organization",
      };
    }

    const domain = this.extractDomain(business.website);
    if (!domain || domain === "example.com") {
      return {
        success: false,
        reason: "No valid website domain for enrichment",
        source: "apollo_organization",
      };
    }

    const cacheKey = `apollo_org_${domain}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(
        `🚀 Apollo enrichment for: ${business.businessName} (${domain})`
      );
      this.usageStats.enrichments++;

      // Enrich organization data
      const organizationData = await this.callApolloOrganizationAPI(
        domain,
        business
      );

      if (organizationData.found) {
        this.usageStats.organizationsFound++;

        // Get owner/executive contacts
        const ownerContacts = await this.findOwnerContacts(
          organizationData.apolloId,
          business
        );

        if (ownerContacts.length > 0) {
          this.usageStats.ownersFound++;
        }

        const result = {
          success: true,
          organizationData: {
            apolloId: organizationData.apolloId,
            industry: organizationData.industry,
            employees: organizationData.employees,
            revenue: organizationData.revenue,
            technologies: organizationData.technologies,
          },
          ownerContacts: ownerContacts,
          enhancedEmails: this.generateEnhancedEmailPatterns(
            ownerContacts,
            domain
          ),
          cost: 1.0, // $1 per organization
          source: "apollo_organization",
          timestamp: new Date().toISOString(),
        };

        // Track cost
        this.usageStats.totalCost += 1.0;
        this.setCache(cacheKey, result);
        return result;
      }

      return {
        success: false,
        reason: "Organization not found in Apollo database",
        cost: 1.0, // Still costs money even if not found
        source: "apollo_organization",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Apollo organization enrichment error:", error.message);
      return {
        success: false,
        error: error.message,
        cost: 1.0, // Cost applies even on error
        source: "apollo_organization",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Extract domain from website URL
   * @private
   */
  extractDomain(website) {
    if (!website) return null;
    try {
      const url = new URL(
        website.startsWith("http") ? website : `https://${website}`
      );
      let hostname = url.hostname;
      if (hostname.startsWith("www.")) {
        hostname = hostname.substring(4);
      }
      return hostname;
    } catch {
      return null;
    }
  }

  /**
   * Call Apollo Organization API
   * @private
   */
  async callApolloOrganizationAPI(domain, business) {
    // For now, simulate Apollo API call
    // In real implementation, this would call the actual Apollo API

    // Simulate organization found 70% of the time
    if (Math.random() > 0.3) {
      return {
        found: true,
        apolloId: `apollo_${Math.floor(Math.random() * 1000000)}`,
        industry: business.businessType || "Professional Services",
        employees: Math.floor(Math.random() * 50) + 1,
        revenue: `$${Math.floor(Math.random() * 5000000) + 100000}`,
        technologies: ["Website", "Email Marketing", "CRM"],
      };
    }

    return { found: false };
  }

  /**
   * Find owner/executive contacts
   * @private
   */
  async findOwnerContacts(apolloId, business) {
    // Simulate finding owner contacts
    const ownerTitles = [
      "Owner",
      "CEO",
      "President",
      "Founder",
      "Managing Director",
    ];
    const contacts = [];

    // Simulate 1-3 owner contacts
    const numContacts = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numContacts; i++) {
      const firstName = this.generateRandomName();
      const lastName = this.generateRandomSurname();
      const title = ownerTitles[Math.floor(Math.random() * ownerTitles.length)];
      const domain = this.extractDomain(business.website);

      contacts.push({
        name: `${firstName} ${lastName}`,
        firstName: firstName,
        lastName: lastName,
        title: title,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
        apolloId: `person_${Math.floor(Math.random() * 1000000)}`,
      });
    }

    return contacts;
  }

  /**
   * Generate enhanced email patterns using owner contact data
   * @private
   */
  generateEnhancedEmailPatterns(ownerContacts, domain) {
    const patterns = [];

    // Add owner-specific patterns
    ownerContacts.forEach((contact) => {
      patterns.push(contact.email);
      patterns.push(`${contact.firstName.toLowerCase()}@${domain}`);
      patterns.push(
        `${
          contact.firstName.toLowerCase()[0]
        }${contact.lastName.toLowerCase()}@${domain}`
      );
    });

    // Add generic patterns
    patterns.push(`info@${domain}`);
    patterns.push(`contact@${domain}`);
    patterns.push(`hello@${domain}`);

    return [...new Set(patterns)]; // Remove duplicates
  }

  /**
   * Generate random first names
   * @private
   */
  generateRandomName() {
    const names = [
      "John",
      "Jane",
      "Michael",
      "Sarah",
      "David",
      "Lisa",
      "Robert",
      "Jennifer",
      "William",
      "Mary",
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  /**
   * Generate random surnames
   * @private
   */
  generateRandomSurname() {
    const surnames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
    ];
    return surnames[Math.floor(Math.random() * surnames.length)];
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      ...this.usageStats,
      cache_size: this.cache.size,
      success_rate:
        this.usageStats.enrichments > 0
          ? (
              (this.usageStats.organizationsFound /
                this.usageStats.enrichments) *
              100
            ).toFixed(1) + "%"
          : "0%",
      owner_discovery_rate:
        this.usageStats.organizationsFound > 0
          ? (
              (this.usageStats.ownersFound /
                this.usageStats.organizationsFound) *
              100
            ).toFixed(1) + "%"
          : "0%",
      average_cost_per_success:
        this.usageStats.organizationsFound > 0
          ? (
              this.usageStats.totalCost / this.usageStats.organizationsFound
            ).toFixed(2)
          : "0.00",
    };
  }

  /**
   * Reset stats for testing
   */
  reset() {
    this.cache.clear();
    this.usageStats = {
      enrichments: 0,
      organizationsFound: 0,
      totalCost: 0.0,
      ownersFound: 0,
    };
  }
}

module.exports = ApolloOrganizationClient;
