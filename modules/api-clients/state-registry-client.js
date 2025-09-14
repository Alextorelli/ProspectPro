/**
 * State Business Registry API Client
 * 
 * Integrates with free state-level business entity APIs to discover
 * business owner/officer information from official government records.
 */

class StateRegistryClient {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        
        // State API endpoints (free sources)
        this.stateApis = {
            california: {
                name: 'California Secretary of State',
                searchUrl: 'https://bizfileonline.sos.ca.gov/api/Records/businesssearch',
                free: true,
                rateLimit: 60 // requests per minute
            },
            delaware: {
                name: 'Delaware Division of Corporations',
                searchUrl: 'https://icis.corp.delaware.gov/api/Records/search',
                free: true,
                rateLimit: 30
            },
            florida: {
                name: 'Florida Division of Corporations',
                searchUrl: 'https://search.sunbiz.org/api/Records/search',
                free: true,
                rateLimit: 60
            },
            texas: {
                name: 'Texas Secretary of State',
                searchUrl: 'https://mycpa.cpa.state.tx.us/coa/api/Records/search',
                free: true,
                rateLimit: 30
            },
            newyork: {
                name: 'New York Department of State',
                searchUrl: 'https://appext20.dos.ny.gov/corp_public/api/Records/search',
                free: true,
                rateLimit: 30
            }
        };
    }

    /**
     * Search for business owner information across multiple state registries
     */
    async searchStateRegistries(businessName, businessAddress) {
        try {
            console.log(`🏛️ Searching state registries for: ${businessName}`);
            
            const results = {
                ownerName: null,
                ownerTitle: null,
                officers: [],
                registeredAgent: null,
                incorporationState: null,
                entityType: null,
                sources: ['state_registries']
            };

            // Determine most likely state based on address
            const targetState = this.extractStateFromAddress(businessAddress);
            const statesToSearch = targetState ? [targetState, 'delaware', 'california'] : ['delaware', 'california', 'florida'];

            // Search relevant state registries
            for (const state of statesToSearch) {
                try {
                    const stateResult = await this.searchStateRegistry(state, businessName);
                    if (stateResult && stateResult.ownerName) {
                        this.mergeStateResults(results, stateResult);
                        results.incorporationState = state;
                        break; // Found owner info, no need to search more states
                    }
                } catch (error) {
                    console.log(`State registry search failed for ${state}:`, error.message);
                }
                
                // Rate limiting between state searches
                await this.delay(1000);
            }

            console.log(`✅ State registry search complete. Found owner: ${results.ownerName ? 'Yes' : 'No'}`);
            return results;

        } catch (error) {
            console.error('State registry search failed:', error);
            return {
                ownerName: null,
                sources: [],
                error: error.message
            };
        }
    }

    /**
     * Search individual state registry
     */
    async searchStateRegistry(state, businessName) {
        const stateConfig = this.stateApis[state];
        if (!stateConfig) return null;

        try {
            // Note: These are example implementations
            // Real implementations would need to match each state's actual API format
            
            switch (state) {
                case 'delaware':
                    return await this.searchDelaware(businessName);
                case 'california':
                    return await this.searchCalifornia(businessName);
                case 'florida':
                    return await this.searchFlorida(businessName);
                default:
                    return await this.searchGenericState(state, businessName);
            }

        } catch (error) {
            console.log(`${stateConfig.name} search failed:`, error.message);
            return null;
        }
    }

    /**
     * Delaware-specific search (many businesses incorporate here)
     */
    async searchDelaware(businessName) {
        try {
            // Delaware has a searchable database but requires specific formatting
            const searchTerm = this.cleanBusinessName(businessName);
            
            // This is a placeholder - would need Delaware's actual API structure
            const response = await fetch(`https://icis.corp.delaware.gov/api/Records/search?name=${encodeURIComponent(searchTerm)}`, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'application/json'
                },
                timeout: 10000
            });

            if (!response.ok) {
                throw new Error(`Delaware API returned ${response.status}`);
            }

            const data = await response.json();
            return this.parseDelawareResponse(data);

        } catch (error) {
            // For now, return null - this would be implemented with actual Delaware API
            console.log('Delaware search not yet implemented:', error.message);
            return null;
        }
    }

    /**
     * California-specific search
     */
    async searchCalifornia(businessName) {
        try {
            // California has business search APIs available
            const searchTerm = this.cleanBusinessName(businessName);
            
            // Placeholder for California SOS API
            return null;

        } catch (error) {
            console.log('California search not yet implemented:', error.message);
            return null;
        }
    }

    /**
     * Florida-specific search
     */
    async searchFlorida(businessName) {
        try {
            // Florida Sunbiz has searchable records
            const searchTerm = this.cleanBusinessName(businessName);
            
            // Placeholder for Florida Sunbiz API
            return null;

        } catch (error) {
            console.log('Florida search not yet implemented:', error.message);
            return null;
        }
    }

    /**
     * Generic state search template
     */
    async searchGenericState(state, businessName) {
        // Template for implementing additional state APIs
        return null;
    }

    /**
     * Utility methods
     */
    extractStateFromAddress(address) {
        if (!address) return null;

        const stateAbbreviations = {
            'CA': 'california', 'CALIFORNIA': 'california',
            'DE': 'delaware', 'DELAWARE': 'delaware',
            'FL': 'florida', 'FLORIDA': 'florida',
            'TX': 'texas', 'TEXAS': 'texas',
            'NY': 'newyork', 'NEW YORK': 'newyork'
        };

        const upperAddress = address.toUpperCase();
        for (const [abbrev, state] of Object.entries(stateAbbreviations)) {
            if (upperAddress.includes(abbrev)) {
                return state;
            }
        }

        return null;
    }

    cleanBusinessName(name) {
        return name
            .replace(/\b(LLC|INC|CORP|LTD|CO|COMPANY|CORPORATION|LIMITED)\b/gi, '')
            .trim()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ');
    }

    parseDelawareResponse(data) {
        // Parse Delaware API response format
        if (!data || !data.records || data.records.length === 0) {
            return null;
        }

        const record = data.records[0];
        return {
            ownerName: record.officers?.[0]?.name || null,
            ownerTitle: record.officers?.[0]?.title || 'Officer',
            officers: record.officers || [],
            registeredAgent: record.agent?.name || null,
            entityType: record.type || null
        };
    }

    mergeStateResults(target, source) {
        if (source.ownerName && !target.ownerName) {
            target.ownerName = source.ownerName;
        }
        if (source.ownerTitle && !target.ownerTitle) {
            target.ownerTitle = source.ownerTitle;
        }
        if (source.officers && source.officers.length > 0) {
            target.officers = [...target.officers, ...source.officers];
        }
        if (source.registeredAgent && !target.registeredAgent) {
            target.registeredAgent = source.registeredAgent;
        }
        if (source.entityType && !target.entityType) {
            target.entityType = source.entityType;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = StateRegistryClient;