const express = require('express');
const GooglePlacesClient = require('../modules/api-clients/google-places');
const EnhancedLeadDiscovery = require('../modules/enhanced-lead-discovery');
const CampaignLogger = require('../modules/logging/campaign-logger');
const router = express.Router();

// Initialize enhanced discovery algorithm with all API keys
const apiKeys = {
    hunterIO: process.env.HUNTER_IO_API_KEY,
    neverBounce: process.env.NEVERBOUNCE_API_KEY,
    googlePlaces: process.env.GOOGLE_PLACES_API_KEY
};

const googlePlacesClient = new GooglePlacesClient(apiKeys.googlePlaces);
const enhancedDiscovery = new EnhancedLeadDiscovery(apiKeys);
const campaignLogger = new CampaignLogger();

// POST /api/business/discover
router.post('/discover', async (req, res) => {
    try {
        const { 
            query, 
            location, 
            count = 20, 
            budgetLimit = 25.00, 
            qualityThreshold = 75,
            batchType = 'cost-optimized' 
        } = req.body;

        // Validate required parameters
        if (!query || !location) {
            return res.status(400).json({
                error: 'Query and location are required',
                provided: { query, location }
            });
        }

        // Validate API keys for enhanced features
        const missingKeys = [];
        if (!apiKeys.googlePlaces) missingKeys.push('GOOGLE_PLACES_API_KEY');
        if (!apiKeys.hunterIO) missingKeys.push('HUNTER_IO_API_KEY (recommended)');
        if (!apiKeys.neverBounce) missingKeys.push('NEVERBOUNCE_API_KEY (recommended)');

        if (!apiKeys.googlePlaces) {
            return res.status(500).json({
                error: 'Google Places API key is required',
                missingKeys
            });
        }

        console.log(`🚀 Enhanced business discovery: "${query}" in "${location}"`);
        console.log(`💰 Budget: $${budgetLimit}, Quality threshold: ${qualityThreshold}%, Count: ${count}`);

        const startTime = Date.now();

        // Stage 1: Google Places Discovery (Primary Source)
        const googleResults = await googlePlacesClient.textSearch({
            query: `${query} in ${location}`,
            type: 'establishment'
        });

        if (!googleResults || googleResults.length === 0) {
            return res.json({
                success: false,
                message: 'No businesses found for the specified query and location',
                results: [],
                totalCost: 0,
                processingTime: Date.now() - startTime
            });
        }

        console.log(`🔍 Found ${googleResults.length} businesses from Google Places`);

        // Stage 2-4: Enhanced Multi-Source Validation Pipeline
        const discoveryOptions = {
            budgetLimit,
            qualityThreshold,
            maxResults: count,
            prioritizeLocalBusinesses: true,
            enablePropertyIntelligence: true,
            enableRegistryValidation: true
        };

        const enhancedResults = await enhancedDiscovery.discoverAndValidateLeads(
            googleResults, 
            discoveryOptions
        );

        // Log campaign results
        await campaignLogger.logCampaign({
            query,
            location,
            totalBusinesses: googleResults.length,
            qualifiedLeads: enhancedResults.leads.length,
            totalCost: enhancedResults.totalCost,
            qualityMetrics: enhancedResults.qualityMetrics,
            usageStats: enhancedResults.usageStats,
            processingTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
        });

        // Return enhanced results with full transparency
        res.json({
            success: true,
            results: enhancedResults.leads,
            metadata: {
                totalProcessed: enhancedResults.totalProcessed,
                totalQualified: enhancedResults.leads.length,
                qualificationRate: Math.round((enhancedResults.leads.length / enhancedResults.totalProcessed) * 100),
                averageConfidence: enhancedResults.qualityMetrics.averageConfidence,
                totalCost: enhancedResults.totalCost,
                costPerLead: enhancedResults.leads.length > 0 ? 
                    (enhancedResults.totalCost / enhancedResults.leads.length).toFixed(3) : 0,
                processingTime: Date.now() - startTime,
                budgetUtilization: Math.round((enhancedResults.totalCost / budgetLimit) * 100)
            },
            qualityBreakdown: enhancedResults.qualityMetrics,
            apiUsage: enhancedResults.usageStats,
            dataEnhancements: {
                businessRegistrationChecks: enhancedResults.qualityMetrics.registrationVerified || 0,
                websiteValidations: enhancedResults.qualityMetrics.websitesAccessible || 0,
                emailVerifications: enhancedResults.qualityMetrics.emailsVerified || 0,
                propertyIntelligence: enhancedResults.qualityMetrics.propertiesFound || 0
            }
        });

    } catch (error) {
        console.error('❌ Enhanced business discovery failed:', error);
        
        res.status(500).json({
            success: false,
            error: error.message,
            recommendations: [
                'Check API key configuration',
                'Verify budget limits and thresholds',
                'Ensure network connectivity to external APIs',
                'Review query format and location specificity'
            ]
        });
    }
});
// Removed stray unreachable block with top-level await and undefined symbols (preValidationScorer, ownerDiscovery, etc.)

// GET /api/business/stats - Get campaign statistics for admin dashboard
router.get('/stats', async (req, res) => {
    try {
        const stats = await campaignLogger.getCampaignStats();
        const recentCampaigns = await campaignLogger.getRecentCampaigns(5);
        const enrichmentStats = ownerDiscovery.getEnrichmentStats();

        res.json({
            success: true,
            aggregateStats: stats,
            recentCampaigns: recentCampaigns,
            currentSessionStats: enrichmentStats
        });
    } catch (error) {
        console.error('Failed to get campaign stats:', error);
        res.status(500).json({
            error: 'Failed to retrieve statistics',
            message: error.message
        });
    }
});

// POST /api/business/usage-report - Generate usage report for date range
router.post('/usage-report', async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'startDate and endDate are required'
            });
        }

        const report = await campaignLogger.getUsageReport(startDate, endDate);
        
        res.json({
            success: true,
            report: report
        });
    } catch (error) {
        console.error('Failed to generate usage report:', error);
        res.status(500).json({
            error: 'Failed to generate usage report',
            message: error.message
        });
    }
});

// Helper function to calculate quality distribution
function calculateQualityDistribution(businesses) {
    if (!businesses) return { A: 0, B: 0, C: 0, D: 0, F: 0 };
    
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    businesses.forEach(b => {
        const grade = b.qualityGrade || 'F';
        if (distribution[grade] !== undefined) {
            distribution[grade]++;
        }
    });
    
    return distribution;
}

function mergeBusinessSources(googleResults, yellowPagesResults) {
    const merged = [...googleResults];
    
    // Create a more sophisticated deduplication key using name + address
    const getBusinessKey = (business) => {
        const name = business.name?.toLowerCase().trim() || '';
        const address = business.address?.toLowerCase().trim() || '';
        // Use first part of address to handle slight variations
        const addressKey = address.split(',')[0] || address;
        return `${name}|${addressKey}`;
    };
    
    const googleKeys = new Set(googleResults.map(b => getBusinessKey(b)));

    // Add Yellow Pages results that aren't already in Google results
    yellowPagesResults.forEach(business => {
        const businessKey = getBusinessKey(business);
        if (!googleKeys.has(businessKey)) {
            merged.push(business);
        }
    });

    return merged;
}

function deduplicateBusinesses(businesses) {
    const seen = new Map();
    const deduplicated = [];
    
    businesses.forEach(business => {
        const name = business.name?.toLowerCase().trim() || '';
        const address = business.address?.toLowerCase().trim() || '';
        const phone = business.phone?.replace(/\D/g, '') || ''; // Remove non-digits
        
        // Create multiple possible keys for deduplication
        const keys = [
            `${name}|${address.split(',')[0]}`, // name + street address
            phone ? `${name}|${phone}` : null,  // name + phone
            business.placeId ? `place_${business.placeId}` : null // Google Places ID
        ].filter(Boolean);
        
        let isDuplicate = false;
        for (const key of keys) {
            if (seen.has(key)) {
                isDuplicate = true;
                break;
            }
        }
        
        if (!isDuplicate) {
            // Mark all keys as seen
            keys.forEach(key => seen.set(key, true));
            deduplicated.push(business);
        }
    });
    
    return deduplicated;
}

module.exports = router;