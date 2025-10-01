/**
 * Enhancement Router for P1 Integrations
 * Routes businesses to relevant enhancement APIs (Trade Associations, Professional Licensing, Apollo)
 * Coordinates all P1 enhancement services
 */

const SpaIndustryAssociationClient = require("./spa-industry-association-client");
const ProfessionalBeautyAssociationClient = require("./professional-beauty-association-client");
const CPALicenseVerificationClient = require("./cpa-license-verification-client");
const ApolloOrganizationClient = require("./apollo-organization-client");

class EnhancementRouter {
  constructor(config = {}) {
    // Initialize all enhancement clients
    this.clients = {
      spaAssociation: new SpaIndustryAssociationClient(),
      beautyAssociation: new ProfessionalBeautyAssociationClient(),
      cpaLicensing: new CPALicenseVerificationClient(),
      apollo: new ApolloOrganizationClient(config.apolloApiKey),
    };

    this.usageStats = {
      totalEnhancements: 0,
      associationEnhancements: 0,
      licensingEnhancements: 0,
      apolloEnhancements: 0,
      totalCost: 0.0,
    };
  }

  /**
   * Apply all requested enhancements to a business
   * @param {Object} business - Business data to enhance
   * @param {Object} options - Enhancement options
   * @returns {Promise<Object>} Enhanced business data
   */
  async enhanceBusiness(business, options = {}) {
    const enhancements = {
      tradeAssociations: [],
      professionalLicenses: [],
      apolloData: null,
      totalConfidenceBoost: 0,
      totalCost: 0.0,
    };

    try {
      // Trade Association Enhancements
      if (options.tradeAssociations) {
        const associationResults = await this.processTradeAssociations(
          business
        );
        enhancements.tradeAssociations = associationResults.associations;
        enhancements.totalConfidenceBoost += associationResults.confidenceBoost;
        this.usageStats.associationEnhancements++;
      }

      // Professional Licensing Enhancements
      if (options.professionalLicensing) {
        const licensingResults = await this.processProfessionalLicensing(
          business
        );
        enhancements.professionalLicenses = licensingResults.licenses;
        enhancements.totalConfidenceBoost += licensingResults.confidenceBoost;
        this.usageStats.licensingEnhancements++;
      }

      // Apollo Organization Enrichment
      if (options.apolloDiscovery) {
        const apolloResults = await this.processApolloEnrichment(business);
        if (apolloResults.success) {
          enhancements.apolloData = apolloResults;
          enhancements.totalConfidenceBoost += 30; // Apollo gives significant boost
        }
        enhancements.totalCost += apolloResults.cost || 1.0;
        this.usageStats.apolloEnhancements++;
        this.usageStats.totalCost += apolloResults.cost || 1.0;
      }

      this.usageStats.totalEnhancements++;

      return {
        success: true,
        enhancements,
        summary: {
          associationsFound: enhancements.tradeAssociations.length,
          licensesFound: enhancements.professionalLicenses.length,
          apolloSuccess: enhancements.apolloData?.success || false,
          totalConfidenceBoost: enhancements.totalConfidenceBoost,
          totalCost: enhancements.totalCost,
        },
      };
    } catch (error) {
      console.error("Enhancement routing error:", error.message);
      return {
        success: false,
        error: error.message,
        enhancements,
        totalCost: enhancements.totalCost,
      };
    }
  }

  /**
   * Process trade association verifications
   * @private
   */
  async processTradeAssociations(business) {
    const associations = [];
    let totalConfidenceBoost = 0;

    try {
      // Spa Industry Association
      const siaResult = await this.clients.spaAssociation.verifySpaMembership(
        business
      );
      if (siaResult.relevant !== false) {
        associations.push({
          source: "spa_industry_association",
          verified: siaResult.verified,
          membershipType: siaResult.membershipType,
          certifications: siaResult.certifications,
          confidenceBoost: siaResult.confidenceBoost || 0,
        });
        totalConfidenceBoost += siaResult.confidenceBoost || 0;
      }

      // Professional Beauty Association
      const pbaResult =
        await this.clients.beautyAssociation.verifyBeautyMembership(business);
      if (pbaResult.relevant !== false) {
        associations.push({
          source: "professional_beauty_association",
          verified: pbaResult.verified,
          membershipLevel: pbaResult.membershipLevel,
          certifications: pbaResult.professionalCertifications,
          specializations: pbaResult.specializations,
          confidenceBoost: pbaResult.confidenceBoost || 0,
        });
        totalConfidenceBoost += pbaResult.confidenceBoost || 0;
      }
    } catch (error) {
      console.error("Trade association processing error:", error.message);
    }

    return {
      associations: associations.filter((a) => a.verified),
      confidenceBoost: totalConfidenceBoost,
    };
  }

  /**
   * Process professional licensing verifications
   * @private
   */
  async processProfessionalLicensing(business) {
    const licenses = [];
    let totalConfidenceBoost = 0;

    try {
      // CPA License Verification
      const cpaResult = await this.clients.cpaLicensing.verifyCPALicense(
        business
      );
      if (cpaResult.relevant !== false) {
        licenses.push({
          source: "cpa_verify",
          licensed: cpaResult.licensedCPA,
          licenseType: "CPA",
          licenseNumber: cpaResult.licenseNumber,
          state: cpaResult.state,
          status: cpaResult.status,
          expirationDate: cpaResult.expirationDate,
          confidenceBoost: cpaResult.confidenceBoost || 0,
        });
        totalConfidenceBoost += cpaResult.confidenceBoost || 0;
      }

      // Add more professional licensing clients here as needed
    } catch (error) {
      console.error("Professional licensing processing error:", error.message);
    }

    return {
      licenses: licenses.filter((l) => l.licensed),
      confidenceBoost: totalConfidenceBoost,
    };
  }

  /**
   * Process Apollo organization enrichment
   * @private
   */
  async processApolloEnrichment(business) {
    try {
      const apolloResult = await this.clients.apollo.enrichOrganization(
        business
      );
      return apolloResult;
    } catch (error) {
      console.error("Apollo enrichment processing error:", error.message);
      return {
        success: false,
        error: error.message,
        cost: 1.0, // Cost applies even on error
      };
    }
  }

  /**
   * Get comprehensive usage statistics
   */
  getUsageStats() {
    return {
      ...this.usageStats,
      clientStats: {
        spaAssociation: this.clients.spaAssociation.getUsageStats(),
        beautyAssociation: this.clients.beautyAssociation.getUsageStats(),
        cpaLicensing: this.clients.cpaLicensing.getUsageStats(),
        apollo: this.clients.apollo.getUsageStats(),
      },
    };
  }

  /**
   * Reset all statistics for testing
   */
  reset() {
    this.usageStats = {
      totalEnhancements: 0,
      associationEnhancements: 0,
      licensingEnhancements: 0,
      apolloEnhancements: 0,
      totalCost: 0.0,
    };

    // Reset all client stats
    Object.values(this.clients).forEach((client) => {
      if (client.reset) client.reset();
    });
  }
}

module.exports = EnhancementRouter;
