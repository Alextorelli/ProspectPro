/**
 * OpenCorporates API Client
 * 
 * Free API for global corporate data including officer information
 * Rate limit: 200 requests/day for free tier
 */

const fetch = require('node-fetch');

class OpenCorporatesClient {
    constructor(apiKey = null) {
        this.baseUrl = 'https://api.opencorporates.com/v0.4';
        this.apiKey = apiKey; // Optional - increases rate limits
        this.rateLimit = apiKey ? 2000 : 200; // requests per day
        this.requestsToday = 0;
        this.lastRequestTime = 0;
    }

    /**
     * Search for business owner information using OpenCorporates
     */
    async searchBusinessOwners(businessName, businessAddress) {
        try {
            console.log(`🌐 Searching OpenCorporates for: ${businessName}`);

            if (this.requestsToday >= this.rateLimit) {
                throw new Error('OpenCorporates daily rate limit reached');
            }

            // Rate limiting: 1 request per second
            await this.throttleRequests();

            const results = {
                ownerName: null,
                ownerTitle: null,
                officers: [],
                companyNumber: null,
                incorporationDate: null,
                jurisdiction: null,
                sources: ['opencorporates']
            };

            // Search for companies by name
            const companies = await this.searchCompanies(businessName, businessAddress);
            
            if (companies && companies.length > 0) {
                // Get the best matching company
                const bestMatch = this.findBestCompanyMatch(companies, businessName, businessAddress);
                
                if (bestMatch) {
                    // Get detailed officer information
                    const officers = await this.getCompanyOfficers(bestMatch.jurisdiction_code, bestMatch.company_number);
                    
                    if (officers && officers.length > 0) {
                        results.officers = officers;
                        
                        // Find primary owner/officer
                        const primaryOfficer = this.findPrimaryOfficer(officers);
                        if (primaryOfficer) {
                            results.ownerName = primaryOfficer.name;
                            results.ownerTitle = primaryOfficer.position || 'Officer';
                        }
                    }
                    
                    results.companyNumber = bestMatch.company_number;
                    results.incorporationDate = bestMatch.incorporation_date;
                    results.jurisdiction = bestMatch.jurisdiction_code;
                }
            }

            console.log(`✅ OpenCorporates search complete. Found owner: ${results.ownerName ? 'Yes' : 'No'}`);
            return results;

        } catch (error) {
            console.error('OpenCorporates search failed:', error);
            return {
                ownerName: null,
                sources: [],
                error: error.message
            };
        }
    }

    /**
     * Search for companies by name
     */
    async searchCompanies(businessName, businessAddress) {
        try {
            const cleanName = this.cleanBusinessName(businessName);
            const jurisdiction = this.guessJurisdiction(businessAddress);
            
            let searchUrl = `${this.baseUrl}/companies/search?q=${encodeURIComponent(cleanName)}`;
            
            if (jurisdiction) {
                searchUrl += `&jurisdiction_code=${jurisdiction}`;
            }
            
            if (this.apiKey) {
                searchUrl += `&api_token=${this.apiKey}`;
            }

            const response = await fetch(searchUrl, {
                headers: {
                    'User-Agent': 'ProspectPro/1.0 (Lead Generation)',
                    'Accept': 'application/json'
                },
                timeout: 15000
            });

            this.requestsToday++;

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('OpenCorporates rate limit exceeded');
                }
                throw new Error(`OpenCorporates API returned ${response.status}`);
            }

            const data = await response.json();
            return data.results?.companies || [];

        } catch (error) {
            console.error('OpenCorporates company search failed:', error);
            return [];
        }
    }

    /**
     * Get officers for a specific company
     */
    async getCompanyOfficers(jurisdiction, companyNumber) {
        try {
            if (this.requestsToday >= this.rateLimit) {
                throw new Error('OpenCorporates daily rate limit reached');
            }

            await this.throttleRequests();

            let officersUrl = `${this.baseUrl}/companies/${jurisdiction}/${companyNumber}/officers`;
            
            if (this.apiKey) {
                officersUrl += `?api_token=${this.apiKey}`;
            }

            const response = await fetch(officersUrl, {
                headers: {
                    'User-Agent': 'ProspectPro/1.0 (Lead Generation)',
                    'Accept': 'application/json'
                },
                timeout: 15000
            });

            this.requestsToday++;

            if (!response.ok) {
                if (response.status === 404) {
                    return []; // No officers data available
                }
                throw new Error(`OpenCorporates officers API returned ${response.status}`);
            }

            const data = await response.json();
            return this.parseOfficers(data.results?.officers || []);

        } catch (error) {
            console.error('OpenCorporates officers search failed:', error);
            return [];
        }
    }

    /**
     * Find the best matching company from search results
     */
    findBestCompanyMatch(companies, businessName, businessAddress) {
        if (!companies || companies.length === 0) return null;

        // Score each company based on name similarity and location
        const scored = companies.map(company => {
            let score = 0;
            const companyData = company.company;
            
            // Name similarity (primary factor)
            const nameSimilarity = this.calculateStringSimilarity(
                this.cleanBusinessName(businessName),
                this.cleanBusinessName(companyData.name)
            );
            score += nameSimilarity * 70;
            
            // Location match (if available)
            if (businessAddress && companyData.registered_address) {
                const locationSimilarity = this.calculateLocationSimilarity(
                    businessAddress,
                    companyData.registered_address.locality || companyData.registered_address.region
                );
                score += locationSimilarity * 20;
            }
            
            // Company status (prefer active companies)
            if (companyData.company_status === 'Active' || companyData.company_status === 'Good Standing') {
                score += 10;
            }
            
            return {
                company: companyData,
                score: score
            };
        });

        // Return the highest scoring company (minimum 50% match)
        scored.sort((a, b) => b.score - a.score);
        return scored[0].score >= 50 ? scored[0].company : null;
    }

    /**
     * Find the primary officer (typically CEO, President, or first listed)
     */
    findPrimaryOfficer(officers) {
        if (!officers || officers.length === 0) return null;

        // Priority order for officer positions
        const priorityPositions = [
            'ceo', 'chief executive officer', 'president', 'owner', 'founder',
            'managing director', 'director', 'manager', 'principal', 'secretary'
        ];

        for (const position of priorityPositions) {
            const officer = officers.find(o => 
                o.position && o.position.toLowerCase().includes(position)
            );
            if (officer && officer.name) return officer;
        }

        // If no specific position found, return the first officer with a name
        return officers.find(o => o.name) || officers[0];
    }

    /**
     * Utility methods
     */
    cleanBusinessName(name) {
        if (!name) return '';
        return name
            .replace(/\b(LLC|INC|CORP|LTD|CO|COMPANY|CORPORATION|LIMITED|PLC)\b/gi, '')
            .trim()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .toLowerCase();
    }

    guessJurisdiction(address) {
        if (!address) return null;

        const upperAddress = address.toUpperCase();
        
        // US states
        if (upperAddress.includes('CA') || upperAddress.includes('CALIFORNIA')) return 'us_ca';
        if (upperAddress.includes('DE') || upperAddress.includes('DELAWARE')) return 'us_de';
        if (upperAddress.includes('FL') || upperAddress.includes('FLORIDA')) return 'us_fl';
        if (upperAddress.includes('NY') || upperAddress.includes('NEW YORK')) return 'us_ny';
        if (upperAddress.includes('TX') || upperAddress.includes('TEXAS')) return 'us_tx';
        
        // General US
        if (upperAddress.includes('USA') || upperAddress.includes('UNITED STATES')) return 'us';
        
        return null; // Let OpenCorporates search globally
    }

    calculateStringSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length * 100;
    }

    calculateLocationSimilarity(address1, address2) {
        if (!address1 || !address2) return 0;
        
        const clean1 = address1.toLowerCase().replace(/[^\w\s]/g, ' ');
        const clean2 = address2.toLowerCase().replace(/[^\w\s]/g, ' ');
        
        const words1 = clean1.split(/\s+/);
        const words2 = clean2.split(/\s+/);
        
        let matches = 0;
        for (const word of words1) {
            if (word.length > 2 && words2.includes(word)) {
                matches++;
            }
        }
        
        return (matches / Math.max(words1.length, words2.length)) * 100;
    }

    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
        
        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + cost
                );
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    parseOfficers(officers) {
        return officers.map(officerWrapper => {
            const officer = officerWrapper.officer;
            return {
                name: officer.name,
                position: officer.position,
                startDate: officer.start_date,
                endDate: officer.end_date,
                nationality: officer.nationality,
                address: officer.address
            };
        }).filter(officer => officer.name); // Only include officers with names
    }

    async throttleRequests() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < 1000) { // 1 second between requests
            await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
        }
        
        this.lastRequestTime = Date.now();
    }

    // Reset daily counter (call this once per day)
    resetDailyCounter() {
        this.requestsToday = 0;
    }

    getRemainingQuota() {
        return this.rateLimit - this.requestsToday;
    }
}

module.exports = OpenCorporatesClient;