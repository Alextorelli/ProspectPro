const axios = require('axios');
const cheerio = require('cheerio');

class YellowPagesScraper {
    constructor() {
        this.baseUrl = 'https://www.yellowpages.com';
        this.rateLimitDelay = 2000; // 2 seconds between requests
        this.requestCount = 0;
    }

    async search(query, location, maxResults = 20) {
        try {
            console.log(`📖 Yellow Pages scraping: "${query}" in "${location}"`);

            const searchUrl = `${this.baseUrl}/search`;
            const response = await axios.get(searchUrl, {
                params: {
                    search_terms: query,
                    geo_location_terms: location
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 15000
            });

            this.requestCount++;
            const $ = cheerio.load(response.data);
            const businesses = [];

            $('.search-results .result, .organic .result').each((index, element) => {
                if (businesses.length >= maxResults) return false;

                const $business = $(element);

                const name = $business.find('.business-name, h3 a, .n').text().trim();
                const address = $business.find('.adr, .address, .street-address').text().trim();
                const phone = $business.find('.phones .phone, .phone').text().trim();
                const websiteLink = $business.find('.links .track-visit-website, .website-link').attr('href');

                if (name && address) {
                    businesses.push({
                        name: name,
                        address: address,
                        phone: phone || null,
                        website: websiteLink || null,
                        source: 'yellow_pages',
                        extractedAt: new Date().toISOString()
                    });
                }
            });

            // Rate limiting - be respectful
            await this.delay(this.rateLimitDelay);

            console.log(`📖 Yellow Pages found ${businesses.length} businesses`);
            return businesses;

        } catch (error) {
            console.error(`Yellow Pages scraping failed for "${query}" in "${location}":`, error.message);
            return []; // Return empty array instead of failing
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getUsageStats() {
        return {
            requestCount: this.requestCount,
            totalCost: 0, // Free scraping
            rateLimitDelay: this.rateLimitDelay
        };
    }
}

module.exports = YellowPagesScraper;