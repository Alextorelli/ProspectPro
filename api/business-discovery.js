const express = require('express');
const GooglePlacesClient = require('../modules/api-clients/google-places');
const YellowPagesScraper = require('../modules/scrapers/yellow-pages-scraper');
const PreValidationScorer = require('../modules/validators/pre-validation');
const router = express.Router();

const googlePlacesClient = new GooglePlacesClient(process.env.GOOGLE_PLACES_API_KEY);
const yellowPagesScraper = new YellowPagesScraper();
const preValidationScorer = new PreValidationScorer();

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
        const allBusinesses = mergeBusinessSources(googleResults, yellowPagesResults);

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

        const limitedResults = preValidated.slice(0, count);

        // Stage 5: Enrich with contact details from Google Places
        console.log(`🔍 Enriching ${limitedResults.length} businesses with contact details...`);
        const enrichedBusinesses = [];
        
        for (const business of limitedResults) {
            try {
                // Get detailed contact information
                if (business.placeId) {
                    const details = await googlePlacesClient.getPlaceDetails(business.placeId);
                    enrichedBusinesses.push({
                        ...business,
                        phone: details.phone,
                        website: details.website,
                        hours: details.hours,
                        reviews: details.reviews
                    });
                } else {
                    // No placeId (likely from Yellow Pages), keep as is
                    enrichedBusinesses.push(business);
                }
            } catch (error) {
                console.error(`Failed to enrich ${business.name}:`, error.message);
                // Keep business without enrichment rather than losing it
                enrichedBusinesses.push(business);
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
    const googleNames = new Set(googleResults.map(b => b.name.toLowerCase()));

    // Add Yellow Pages results that aren't already in Google results
    yellowPagesResults.forEach(business => {
        if (!googleNames.has(business.name.toLowerCase())) {
            merged.push(business);
        }
    });

    return merged;
}

module.exports = router;