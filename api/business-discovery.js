const express = require('express');
const GooglePlacesClient = require('../modules/api-clients/google-places');
const YellowPagesScraper = require('../modules/scrapers/yellow-pages-scraper');
const PreValidationScorer = require('../modules/validators/pre-validation');
const OwnerDiscovery = require('../modules/enrichment/owner-discovery');
const router = express.Router();

const googlePlacesClient = new GooglePlacesClient(process.env.GOOGLE_PLACES_API_KEY);
const yellowPagesScraper = new YellowPagesScraper();
const preValidationScorer = new PreValidationScorer();
const ownerDiscovery = new OwnerDiscovery();

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

                // Discover owner information (layered on top)
                const ownerInfo = await ownerDiscovery.discoverOwnerInfo(enrichedBusiness);
                enrichedBusiness.ownerData = ownerInfo;

                enrichedBusinesses.push(enrichedBusiness);

            } catch (error) {
                console.error(`Failed to enrich ${business.name}:`, error.message);
                // Keep business without enrichment rather than losing it
                enrichedBusinesses.push({
                    ...business,
                    ownerData: { confidence: 0, sources: [], error: error.message }
                });
            }
        }

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
                enriched: enrichedBusinesses.filter(b => b.phone || b.website).length
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