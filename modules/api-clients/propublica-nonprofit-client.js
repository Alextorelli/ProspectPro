/**
 * ProPublica Nonprofit Explorer API Client
 * 
 * Provides nonprofit organization validation and intelligence using ProPublica's database
 * - Search nonprofits by name, EIN, or location
 * - Detailed financial information and tax filing data
 * - Board member and executive compensation data
 * - Sector classification and mission analysis
 * - Free access with reasonable rate limiting
 * 
 * API Documentation: https://projects.propublica.org/nonprofits/api
 * Rate Limits: Be respectful - no official limit but use conservative approach
 * 
 * ProspectPro - Zero Fake Data Policy
 */

require('dotenv').config();

class ProPublicaNonprofitClient {
    constructor() {
        this.baseUrl = 'https://projects.propublica.org/nonprofits/api/v2';
        
        // Rate limiting configuration - be conservative with free API
        this.rateLimitPerMinute = 60; // Conservative estimate - 1 per second
        this.requestTimes = [];
        this.rateLimitWindow = 60 * 1000; // 1 minute
        
        // Caching for performance
        this.cache = new Map();
        this.cacheTimeout = 12 * 60 * 60 * 1000; // 12 hours for nonprofit data
        
        // Quality scoring configuration
        this.qualityScore = 60; // MEDIUM quality score for nonprofit sector
        this.costPerRequest = 0.00; // Free API
        
        // Request statistics
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            cachedResponses: 0,
            errorCount: 0,
            rateLimitHits: 0,
            lastRequestTime: null
        };

        // Nonprofit sector classifications
        this.sectorClassifications = {
            'A': 'Arts, Culture, and Humanities',
            'B': 'Educational Institutions and Related Activities',
            'C': 'Environmental Quality, Protection, and Beautification',
            'D': 'Animal-Related',
            'E': 'Health',
            'F': 'Mental Health, Crisis Intervention',
            'G': 'Disease, Disorders, Medical Disciplines',
            'H': 'Medical Research',
            'I': 'Crime, Legal-Related',
            'J': 'Employment, Job-Related',
            'K': 'Food, Agriculture, and Nutrition',
            'L': 'Housing, Shelter',
            'M': 'Public Safety, Disaster Preparedness, and Relief',
            'N': 'Recreation, Sports, Leisure, Athletics',
            'O': 'Youth Development',
            'P': 'Human Services',
            'Q': 'International, Foreign Affairs, and National Security',
            'R': 'Civil Rights, Social Action, Advocacy',
            'S': 'Community Improvement, Capacity Building',
            'T': 'Philanthropy, Voluntarism, and Grantmaking Foundations',
            'U': 'Science and Technology Research Institutes',
            'V': 'Social Science Research Institutes',
            'W': 'Public, Society Benefit',
            'X': 'Religion Related',
            'Y': 'Mutual/Membership Benefit Organizations',
            'Z': 'Unknown'
        };
    }

    /**
     * Search for nonprofit organizations
     * @param {string} searchTerm - Organization name, EIN, or location
     * @param {Object} options - Search options
     * @param {string} options.state - State filter (two-letter code)
     * @param {string} options.nteeCode - NTEE code filter
     * @param {number} options.minRevenue - Minimum revenue filter
     * @param {number} options.maxRevenue - Maximum revenue filter
     * @param {boolean} options.includeFinancials - Whether to include detailed financial data
     * @returns {Object} Search results with normalized structure
     */
    async searchNonprofits(searchTerm, options = {}) {
        if (!searchTerm || typeof searchTerm !== 'string') {
            throw new Error('Search term is required and must be a string');
        }

        // Check cache first
        const cacheKey = `propublica_search_${searchTerm.toLowerCase().trim()}_${JSON.stringify(options)}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                this.stats.cachedResponses++;
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        try {
            // Check if searchTerm looks like an EIN
            const einMatch = searchTerm.match(/^\d{2}-?\d{7}$/);
            if (einMatch) {
                const ein = searchTerm.replace('-', '');
                return this.getOrganizationByEIN(ein, options);
            }

            // General search
            const searchParams = new URLSearchParams({
                q: searchTerm.trim()
            });

            // Add optional filters
            if (options.state) {
                searchParams.append('state[id]', options.state.toUpperCase());
            }
            if (options.nteeCode) {
                searchParams.append('ntee[id]', options.nteeCode);
            }
            if (options.minRevenue) {
                searchParams.append('min_revenue', options.minRevenue.toString());
            }
            if (options.maxRevenue) {
                searchParams.append('max_revenue', options.maxRevenue.toString());
            }

            const response = await this.makeRequest(`/search.json?${searchParams}`);
            let normalizedResponse = this.normalizeSearchResponse(response, searchTerm, options);

            // Enhance with detailed financials if requested
            if (options.includeFinancials && normalizedResponse.organizations.length > 0) {
                const enhanced = await this.enhanceWithFinancialData(normalizedResponse.organizations.slice(0, 5));
                normalizedResponse.organizations = enhanced;
            }

            // Cache successful responses
            this.cache.set(cacheKey, {
                data: normalizedResponse,
                timestamp: Date.now()
            });

            return normalizedResponse;

        } catch (error) {
            this.stats.errorCount++;
            console.error('ProPublica Nonprofit search error:', error.message);
            
            return {
                found: false,
                totalResults: 0,
                organizations: [],
                error: error.message,
                source: 'ProPublica Nonprofit Explorer',
                apiCost: this.costPerRequest,
                qualityScore: 0,
                confidenceBoost: 0,
                searchTerm,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get organization details by EIN
     * @param {string} ein - Employer Identification Number
     * @param {Object} options - Options for additional data
     * @returns {Object} Organization details
     */
    async getOrganizationByEIN(ein, options = {}) {
        if (!ein) {
            throw new Error('EIN is required');
        }

        // Clean EIN - remove hyphens and ensure 9 digits
        const cleanEIN = ein.replace(/\D/g, '');
        if (cleanEIN.length !== 9) {
            throw new Error('EIN must be 9 digits');
        }

        const cacheKey = `propublica_ein_${cleanEIN}_${JSON.stringify(options)}`;
        
        // Check cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                this.stats.cachedResponses++;
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        try {
            const response = await this.makeRequest(`/organizations/${cleanEIN}.json`);
            const normalizedResponse = this.normalizeOrganizationResponse(response, cleanEIN);
            
            // Cache successful responses
            this.cache.set(cacheKey, {
                data: normalizedResponse,
                timestamp: Date.now()
            });

            return normalizedResponse;

        } catch (error) {
            console.error(`Error fetching organization for EIN ${ein}:`, error.message);
            
            return {
                found: false,
                ein: cleanEIN,
                error: error.message,
                source: 'ProPublica Nonprofit Explorer',
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get financial filings for an organization
     * @param {string} ein - Employer Identification Number
     * @param {number} limit - Number of recent filings to retrieve
     * @returns {Object} Financial filings data
     */
    async getFilings(ein, limit = 5) {
        if (!ein) {
            throw new Error('EIN is required');
        }

        const cleanEIN = ein.replace(/\D/g, '');
        const cacheKey = `propublica_filings_${cleanEIN}_${limit}`;
        
        // Check cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                this.stats.cachedResponses++;
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        try {
            const response = await this.makeRequest(`/organizations/${cleanEIN}/filings.json`);
            const filings = this.normalizeFilingsResponse(response, limit);
            
            // Cache successful responses
            this.cache.set(cacheKey, {
                data: filings,
                timestamp: Date.now()
            });

            return filings;

        } catch (error) {
            console.error(`Error fetching filings for EIN ${ein}:`, error.message);
            return null;
        }
    }

    /**
     * Make rate-limited request to ProPublica API
     */
    async makeRequest(endpoint, retries = 3) {
        // Rate limiting
        await this.waitForRateLimit();

        const headers = {
            'User-Agent': 'ProspectPro Business Intelligence System (support@prospectpro.ai)',
            'Accept': 'application/json'
        };

        const url = `${this.baseUrl}${endpoint}`;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, { 
                    headers,
                    timeout: 30000 // 30 second timeout
                });

                // Track request timing
                this.requestTimes.push(Date.now());
                this.stats.totalRequests++;
                this.stats.lastRequestTime = new Date().toISOString();

                if (response.ok) {
                    this.stats.successfulRequests++;
                    return await response.json();
                }

                // Handle specific error codes
                if (response.status === 404) {
                    throw new Error('Organization not found in ProPublica database');
                } else if (response.status === 429) {
                    this.stats.rateLimitHits++;
                    if (attempt < retries) {
                        const delay = Math.pow(2, attempt) * 2000; // Exponential backoff
                        console.log(`ProPublica rate limit hit. Waiting ${delay}ms before retry ${attempt}/${retries}`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    throw new Error('ProPublica rate limit exceeded - Please try again later');
                } else if (response.status >= 500) {
                    if (attempt < retries) {
                        const delay = Math.pow(2, attempt) * 1000;
                        console.log(`ProPublica server error ${response.status}. Retrying in ${delay}ms`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    throw new Error(`ProPublica server error: ${response.status}`);
                } else {
                    throw new Error(`ProPublica API error: ${response.status}`);
                }

            } catch (error) {
                if (attempt === retries) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    /**
     * Rate limiting implementation
     */
    async waitForRateLimit() {
        const now = Date.now();
        
        // Remove requests older than the rate limit window
        this.requestTimes = this.requestTimes.filter(time => now - time < this.rateLimitWindow);
        
        // If we're at the limit, wait
        if (this.requestTimes.length >= this.rateLimitPerMinute) {
            const oldestRequest = Math.min(...this.requestTimes);
            const waitTime = this.rateLimitWindow - (now - oldestRequest) + 100; // Add buffer
            
            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    /**
     * Enhance organizations with detailed financial data
     */
    async enhanceWithFinancialData(organizations) {
        const enhanced = [];
        
        for (const org of organizations) {
            try {
                const filings = await this.getFilings(org.ein, 3);
                enhanced.push({
                    ...org,
                    detailedFilings: filings
                });
            } catch (error) {
                console.warn(`Failed to get filings for ${org.ein}:`, error.message);
                enhanced.push(org);
            }
        }
        
        return enhanced;
    }

    /**
     * Normalize search response
     */
    normalizeSearchResponse(data, searchTerm, options) {
        const organizations = data?.organizations || [];
        
        // Calculate confidence boost
        let confidenceBoost = 0;
        let exactMatches = 0;

        organizations.forEach(org => {
            if (org.organization?.name && 
                org.organization.name.toLowerCase() === searchTerm.toLowerCase()) {
                exactMatches++;
            }
        });

        if (exactMatches > 0) {
            confidenceBoost = 15; // Good confidence for nonprofit matches
        } else if (organizations.length > 0) {
            confidenceBoost = 8; // Moderate confidence for partial matches
        }

        return {
            found: organizations.length > 0,
            totalResults: organizations.length,
            exactMatches,
            organizations: organizations.map(item => {
                const org = item.organization || item;
                return {
                    ein: org.ein || null,
                    name: org.name || null,
                    city: org.city || null,
                    state: org.state || null,
                    zipCode: org.zipcode || null,
                    
                    // Classification
                    nteeCode: org.ntee_code || null,
                    nteeDescription: this.getNTEEDescription(org.ntee_code),
                    sectorClassification: this.getSectorClassification(org.ntee_code),
                    
                    // Financial data (if available)
                    totalRevenue: org.total_revenue || null,
                    totalExpenses: org.total_expenses || null,
                    netAssets: org.net_assets || null,
                    taxPeriod: org.tax_period || null,
                    
                    // Status information
                    subsection: org.subsection || null,
                    classification: org.classification || null,
                    
                    // Validation metadata
                    source: 'ProPublica Nonprofit Explorer',
                    sourceId: org.ein,
                    lastVerified: new Date().toISOString(),
                    dataQuality: 'government_tax_record',
                    isNonprofit: true
                };
            }),
            
            // ProspectPro metadata
            source: 'ProPublica Nonprofit Explorer',
            apiCost: this.costPerRequest,
            qualityScore: this.qualityScore,
            confidenceBoost,
            searchTerm,
            filters: options,
            
            // Performance metrics
            cached: false,
            processingTime: Date.now(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Normalize organization response
     */
    normalizeOrganizationResponse(data, ein) {
        if (!data?.organization) {
            return {
                found: false,
                ein,
                source: 'ProPublica Nonprofit Explorer',
                timestamp: new Date().toISOString()
            };
        }

        const org = data.organization;
        
        return {
            found: true,
            ein,
            organizationDetails: {
                name: org.name || null,
                ein: org.ein || ein,
                
                // Location
                address: org.address || null,
                city: org.city || null,
                state: org.state || null,
                zipCode: org.zipcode || null,
                
                // Classification
                nteeCode: org.ntee_code || null,
                nteeDescription: this.getNTEEDescription(org.ntee_code),
                sectorClassification: this.getSectorClassification(org.ntee_code),
                subsection: org.subsection || null,
                
                // Financial summary (latest available)
                totalRevenue: org.total_revenue || null,
                totalExpenses: org.total_expenses || null,
                netAssets: org.net_assets || null,
                taxPeriod: org.tax_period || null,
                
                // Status
                activeStatus: org.active_status || null,
                classification: org.classification || null,
                deductibility: org.deductibility || null,
                
                // Additional data
                rulingDate: org.ruling_date || null,
                assetAmount: org.asset_amount || null,
                incomeAmount: org.income_amount || null
            },
            
            source: 'ProPublica Nonprofit Explorer',
            qualityScore: this.qualityScore,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Normalize filings response
     */
    normalizeFilingsResponse(data, limit) {
        if (!data?.filings) {
            return null;
        }

        const filings = data.filings.slice(0, limit).map(filing => ({
            taxPeriod: filing.tax_period || null,
            totalRevenue: filing.total_revenue || null,
            totalExpenses: filing.total_expenses || null,
            netAssets: filing.net_assets || null,
            totalAssets: filing.total_assets || null,
            totalLiabilities: filing.total_liabilities || null,
            
            // Program services
            programServiceRevenue: filing.program_service_revenue || null,
            totalProgramServiceExpenses: filing.total_program_service_expenses || null,
            
            // Fundraising
            totalFundraisingExpenses: filing.total_fundraising_expenses || null,
            
            // Management
            totalManagementExpenses: filing.total_management_expenses || null,
            
            // People
            totalEmployees: filing.total_employees || null,
            totalVolunteers: filing.total_volunteers || null,
            
            // Metadata
            filingType: filing.filing_type || null,
            pdfUrl: filing.pdf_url || null
        }));

        return {
            totalFilings: filings.length,
            filings: filings,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Get NTEE code description
     */
    getNTEEDescription(nteeCode) {
        if (!nteeCode) return null;
        
        // Basic NTEE classifications - could be expanded with full lookup table
        const majorGroup = nteeCode.charAt(0);
        return this.sectorClassifications[majorGroup] || 'Unknown Classification';
    }

    /**
     * Get sector classification from NTEE code
     */
    getSectorClassification(nteeCode) {
        if (!nteeCode) return 'Unknown';
        
        const majorGroup = nteeCode.charAt(0);
        
        // Group into broader categories
        if (['A', 'B', 'U', 'V'].includes(majorGroup)) {
            return 'Education & Research';
        } else if (['E', 'F', 'G', 'H'].includes(majorGroup)) {
            return 'Health & Medical';
        } else if (['P', 'O', 'N', 'L', 'K'].includes(majorGroup)) {
            return 'Human Services';
        } else if (['C', 'D'].includes(majorGroup)) {
            return 'Environment & Animals';
        } else if (['X'].includes(majorGroup)) {
            return 'Religion';
        } else if (['T'].includes(majorGroup)) {
            return 'Philanthropy';
        } else if (['Q', 'R', 'S', 'W'].includes(majorGroup)) {
            return 'Public Benefit';
        } else if (['A'].includes(majorGroup)) {
            return 'Arts & Culture';
        } else {
            return 'Other';
        }
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        return {
            ...this.stats,
            rateLimitStatus: {
                currentMinuteRequests: this.requestTimes.length,
                minuteLimit: this.rateLimitPerMinute,
                nextAvailableTime: this.requestTimes.length >= this.rateLimitPerMinute ? 
                    new Date(Math.min(...this.requestTimes) + this.rateLimitWindow).toISOString() : 'now'
            },
            cacheStats: {
                entriesCount: this.cache.size,
                hitRate: this.stats.totalRequests > 0 ? this.stats.cachedResponses / this.stats.totalRequests : 0
            },
            apiInfo: {
                qualityScore: this.qualityScore,
                costPerRequest: this.costPerRequest
            }
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('ProPublica Nonprofit API cache cleared');
    }
}

module.exports = ProPublicaNonprofitClient;