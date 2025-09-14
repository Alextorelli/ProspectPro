const axios = require('axios');

class GooglePlacesClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
        this.requestCount = 0;
        this.costTracking = {
            textSearchCost: 0.032,
            detailsCost: 0.017,
            totalCost: 0
        };
    }

    async textSearch(params) {
        if (!this.apiKey) {
            throw new Error('Google Places API key not configured');
        }

        const url = `${this.baseUrl}/textsearch/json`;

        try {
            console.log(`📡 Google Places Text Search: "${params.query}"`);

            const response = await axios.get(url, {
                params: {
                    query: params.query,
                    key: this.apiKey,
                    type: params.type || 'establishment'
                },
                timeout: 10000
            });

            this.requestCount++;
            this.costTracking.totalCost += this.costTracking.textSearchCost;

            if (response.data.status !== 'OK') {
                throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
            }

            const businesses = response.data.results.map(place => ({
                placeId: place.place_id,
                name: place.name,
                address: place.formatted_address,
                rating: place.rating || 0,
                priceLevel: place.price_level,
                types: place.types || [],
                geometry: place.geometry,
                source: 'google_places',
                photos: place.photos || []
            }));

            console.log(`✅ Google Places found ${businesses.length} businesses`);
            return businesses;

        } catch (error) {
            console.error('Google Places Text Search failed:', error.message);
            throw new Error(`Google Places API failed: ${error.message}`);
        }
    }

    async getPlaceDetails(placeId) {
        if (!this.apiKey) {
            throw new Error('Google Places API key not configured');
        }

        const url = `${this.baseUrl}/details/json`;

        try {
            console.log(`📡 Google Places Details: ${placeId}`);

            const response = await axios.get(url, {
                params: {
                    place_id: placeId,
                    fields: 'formatted_phone_number,website,opening_hours,reviews,international_phone_number',
                    key: this.apiKey
                },
                timeout: 10000
            });

            this.requestCount++;
            this.costTracking.totalCost += this.costTracking.detailsCost;

            if (response.data.status !== 'OK') {
                throw new Error(`Google Places Details API error: ${response.data.status}`);
            }

            const result = response.data.result;
            return {
                phone: result.formatted_phone_number || result.international_phone_number || null,
                website: result.website || null,
                hours: result.opening_hours?.weekday_text || null,
                reviews: result.reviews || []
            };

        } catch (error) {
            console.error('Google Places Details failed:', error.message);
            throw new Error(`Google Places Details API failed: ${error.message}`);
        }
    }

    getUsageStats() {
        return {
            requestCount: this.requestCount,
            totalCost: this.costTracking.totalCost,
            averageCostPerRequest: this.requestCount > 0 ? 
                this.costTracking.totalCost / this.requestCount : 0
        };
    }
}

module.exports = GooglePlacesClient;