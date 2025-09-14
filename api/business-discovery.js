const express = require('express');
const GooglePlacesClient = require('../modules/api-clients/google-places');
const YellowPagesScraper = require('../modules/scrapers/yellow-pages-scraper');
const PreValidationScorer = require('../modules/validators/pre-validation');
const OwnerDiscovery = require('../modules/enrichment/owner-discovery');
const CampaignLogger = require('../modules/logging/campaign-logger');
const router = express.Router();

// Initialize components with API keys from environment
const apiKeys = {
    hunter: process.env.HUNTER_IO_API_KEY,
    neverBounce: process.env.NEVERBOUNCE_API_KEY,
    openCorporates: process.env.OPENCORPORATES_API_KEY
};

const googlePlacesClient = new GooglePlacesClient(process.env.GOOGLE_PLACES_API_KEY);
const yellowPagesScraper = new YellowPagesScraper();
const preValidationScorer = new PreValidationScorer();
const ownerDiscovery = new OwnerDiscovery(apiKeys);
const campaignLogger = new CampaignLogger();

// POST /api/business/discover
router.post('/discover', async (req, res) => {
    try {
        const { query, location, count = 20, batchType = 'small-batch' } = req.body;

        if (!query || !location) {
            return res.status(400).json({
                error: 'Query and location are required',
                provided: { query, location }
            });
        }

        console.log(`🔍 Starting real business discovery: "${query}" in "${location}"`);

        // Stage 1: Google Places Text Search
        const googleResults = await googlePlacesClient.textSearch({
            query: `${query} in ${location}`,
            type: 'establishment'
        });

        // Stage 2: Yellow Pages Scraping (supplemental)
        const yellowPagesResults = await yellowPagesScraper.search(query, location, count);

        // Stage 3: Merge and deduplicate
        const mergedBusinesses = mergeBusinessSources(googleResults, yellowPagesResults);
        const allBusinesses = deduplicateBusinesses(mergedBusinesses);

        // Stage 4: Pre-validate each business BEFORE expensive API calls
        const preValidated = [];
        for (const business of allBusinesses) {
            const score = await preValidationScorer.score(business);
            if (score >= 70) { // Only proceed with high-scoring businesses
                preValidated.push({
                    ...business,
                    preValidationScore: score,
                    sources: business.sources || [business.source]
                });
            }
        }

        // Check if we have enough results
        if (preValidated.length < count) {
            return res.status(206).json({ // 206 Partial Content
                success: false,
                insufficientResults: true,
                message: `Found only ${preValidated.length} unique businesses, but ${count} were requested`,
                suggestions: [
                    "Increase search radius to find more businesses",
                    "Select additional business types in the filter",
                    "Try a broader location (e.g., city instead of specific address)",
                    "Reduce the number of leads requested"
                ],
                businesses: preValidated, // Return what we found
                stats: {
                    totalFound: allBusinesses.length,
                    afterDeduplication: allBusinesses.length,
                    preValidated: preValidated.length,
                    requested: count,
                    googleResults: googleResults.length,
                    yellowPagesResults: yellowPagesResults.length
                },
                searchParams: { query, location, count, batchType }
            });
        }

        const limitedResults = preValidated.slice(0, count);

        // Stage 5: Enrich with contact details and owner information
        console.log(`🔍 Enriching ${limitedResults.length} businesses with contact details and owner info...`);
        const enrichedBusinesses = [];
        const campaignStart = Date.now();
        
        for (const business of limitedResults) {
            try {
                let enrichedBusiness = { ...business };

                // Get detailed contact information from Google Places
                if (business.placeId) {
                    const details = await googlePlacesClient.getPlaceDetails(business.placeId);
                    enrichedBusiness = {
                        ...enrichedBusiness,
                        phone: details.phone,
                        website: details.website,
                        hours: details.hours,
                        reviews: details.reviews
                    };
                }

                // Enhanced owner discovery with cost-efficient API integration
                const ownerInfo = await ownerDiscovery.discoverOwnerInfo(enrichedBusiness);
                
                // Structure the final business data for export
                enrichedBusiness = {
                    ...enrichedBusiness,
                    // Owner information from enrichment
                    ownerName: ownerInfo.ownerName,
                    ownerEmail: ownerInfo.ownerEmail,
                    ownerPhone: ownerInfo.ownerPhone,
                    ownerTitle: ownerInfo.ownerTitle,
                    ownerLinkedIn: ownerInfo.ownerLinkedIn,
                    
                    // Quality metrics
                    confidence: ownerInfo.confidence,
                    qualityGrade: ownerInfo.qualityGrade,
                    
                    // Cost tracking
                    estimatedCost: ownerInfo.estimatedCost,
                    actualCost: ownerInfo.actualCost,
                    
                    // Enrichment metadata
                    sources: ownerInfo.sources,
                    emailVerification: ownerInfo.emailVerification,
                    officers: ownerInfo.officers,
                    incorporationState: ownerInfo.incorporationState,
                    companyNumber: ownerInfo.companyNumber
                };

                enrichedBusinesses.push(enrichedBusiness);

            } catch (error) {
                console.error(`Failed to enrich ${business.name}:`, error.message);
                // Keep business without enrichment rather than losing it
                enrichedBusinesses.push({
                    ...business,
                    ownerName: null,
                    ownerEmail: null,
                    ownerPhone: null,
                    ownerTitle: null,
                    ownerLinkedIn: null,
                    confidence: 0,
                    qualityGrade: 'F',
                    estimatedCost: 0,
                    actualCost: 0,
                    sources: [],
                    error: error.message
                });
            }
        }

        // Calculate campaign duration
        const campaignDuration = (Date.now() - campaignStart) / 1000; // seconds

        // Log campaign results for admin review and algorithm improvement
        try {
            const campaignData = {
                businessType: query,
                location: location,
                businessSize: req.body.businessSize,
                targetCount: count,
                businesses: enrichedBusinesses,
                duration: campaignDuration,
                estimatedCost: enrichedBusinesses.reduce((sum, b) => sum + (b.estimatedCost || 0), 0)
            };
            
            await campaignLogger.logCampaignResults(campaignData);
        } catch (loggingError) {
            console.error('Campaign logging failed:', loggingError.message);
        }

        // Get enrichment statistics
        const enrichmentStats = ownerDiscovery.getEnrichmentStats();

        console.log(`✅ Business discovery complete: ${enrichedBusinesses.length} enriched businesses found`);

        res.json({
            success: true,
            businesses: enrichedBusinesses,
            stats: {
                totalFound: allBusinesses.length,
                preValidated: preValidated.length,
                returned: enrichedBusinesses.length,
                googleResults: googleResults.length,
                yellowPagesResults: yellowPagesResults.length,
                enriched: enrichedBusinesses.filter(b => b.phone || b.website).length,
                withOwners: enrichedBusinesses.filter(b => b.ownerName).length,
                withEmails: enrichedBusinesses.filter(b => b.ownerEmail).length,
                withVerifiedEmails: enrichedBusinesses.filter(b => 
                    b.ownerEmail && b.emailVerification?.isValid
                ).length
            },
            costs: {
                totalEstimated: enrichmentStats.totalCost,
                averagePerLead: enrichmentStats.averageCostPerLead,
                apiCalls: enrichmentStats.apiCalls
            },
            performance: {
                duration: campaignDuration,
                businessesPerMinute: Math.round((enrichedBusinesses.length / campaignDuration) * 60),
                qualityDistribution: calculateQualityDistribution(enrichedBusinesses)
            },
            searchParams: { query, location, count, batchType }
        });

    } catch (error) {
        console.error('Business discovery failed:', error);

        // CRITICAL: Never fallback to fake data
        res.status(500).json({
            error: 'Business discovery failed',
            message: error.message,
            details: 'No fallback data available - all results must be from real APIs'
        });
    }
});

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