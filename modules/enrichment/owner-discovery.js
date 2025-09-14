/**
 * Business Owner Discovery Module
 * 
 * Uses free and low-cost methods to discover business owner information:
 * 1. Website scraping for "About Us", "Team", "Contact" pages
 * 2. Social media profile extraction (LinkedIn, Facebook business pages)
 * 3. Domain WHOIS data for website owners
 * 4. Google search patterns for owner names
 * 5. Yellow Pages enhanced data extraction
 */

class OwnerDiscovery {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    }

    /**
     * Main method to discover owner information for a business
     */
    async discoverOwnerInfo(business) {
        try {
            console.log(`🔍 Discovering owner info for: ${business.name}`);
            
            const ownerInfo = {
                ownerName: null,
                ownerEmail: null,
                ownerPhone: null,
                ownerLinkedIn: null,
                confidence: 0,
                sources: []
            };

            // Method 1: Website scraping for owner info
            if (business.website) {
                const websiteData = await this.scrapeWebsiteForOwner(business.website, business.name);
                this.mergeOwnerData(ownerInfo, websiteData);
            }

            // Method 2: Google search for owner patterns
            const googleData = await this.searchOwnerPatterns(business.name, business.address);
            this.mergeOwnerData(ownerInfo, googleData);

            // Method 3: Social media discovery
            const socialData = await this.findSocialProfiles(business.name, business.address);
            this.mergeOwnerData(ownerInfo, socialData);

            // Method 4: Domain WHOIS (if website available)
            if (business.website) {
                const whoisData = await this.getWhoisOwnerInfo(business.website);
                this.mergeOwnerData(ownerInfo, whoisData);
            }

            // Calculate confidence score
            ownerInfo.confidence = this.calculateConfidence(ownerInfo);

            console.log(`✅ Owner discovery complete for ${business.name}: ${ownerInfo.confidence}% confidence`);
            return ownerInfo;

        } catch (error) {
            console.error(`❌ Owner discovery failed for ${business.name}:`, error.message);
            return {
                ownerName: null,
                ownerEmail: null,
                ownerPhone: null,
                ownerLinkedIn: null,
                confidence: 0,
                sources: [],
                error: error.message
            };
        }
    }

    /**
     * Scrape business website for owner/contact information
     */
    async scrapeWebsiteForOwner(websiteUrl, businessName) {
        try {
            const ownerData = {
                ownerName: null,
                ownerEmail: null,
                ownerPhone: null,
                sources: ['website_scraping']
            };

            // Clean and validate URL
            const url = this.cleanUrl(websiteUrl);
            if (!url) return ownerData;

            // Try common owner info pages
            const pagesToCheck = [
                '/',
                '/about',
                '/about-us',
                '/team',
                '/contact',
                '/contact-us',
                '/staff',
                '/management'
            ];

            for (const page of pagesToCheck) {
                try {
                    const fullUrl = new URL(page, url).href;
                    const content = await this.fetchPageContent(fullUrl);
                    
                    if (content) {
                        const pageOwnerInfo = this.extractOwnerFromContent(content, businessName);
                        this.mergeOwnerData(ownerData, pageOwnerInfo);
                        
                        // If we found good data, we can stop checking more pages
                        if (ownerData.ownerName && ownerData.ownerEmail) {
                            break;
                        }
                    }
                } catch (pageError) {
                    // Continue to next page if one fails
                    console.log(`Could not check page ${page}: ${pageError.message}`);
                }
            }

            return ownerData;

        } catch (error) {
            console.error('Website scraping failed:', error.message);
            return { ownerName: null, ownerEmail: null, ownerPhone: null, sources: [] };
        }
    }

    /**
     * Search Google for owner patterns
     */
    async searchOwnerPatterns(businessName, address) {
        // This would use Google Custom Search API (100 free searches/day)
        // For now, return placeholder structure
        return {
            ownerName: null,
            ownerEmail: null,
            ownerPhone: null,
            sources: ['google_search']
        };
    }

    /**
     * Find social media profiles
     */
    async findSocialProfiles(businessName, address) {
        // This would search for LinkedIn, Facebook business pages
        // For now, return placeholder structure
        return {
            ownerName: null,
            ownerLinkedIn: null,
            sources: ['social_media']
        };
    }

    /**
     * Get WHOIS information for domain owner
     */
    async getWhoisOwnerInfo(websiteUrl) {
        try {
            const domain = this.extractDomain(websiteUrl);
            if (!domain) return { ownerName: null, ownerEmail: null, sources: [] };

            // Use free WHOIS API (limited requests per day)
            // For production, consider paid services like WhoisXML API
            const whoisUrl = `https://api.whois.vu/?q=${domain}`;
            
            const response = await fetch(whoisUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': this.userAgent
                }
            });

            if (!response.ok) {
                throw new Error(`WHOIS API failed: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                ownerName: data.registrant_name || null,
                ownerEmail: data.registrant_email || null,
                sources: ['whois']
            };

        } catch (error) {
            console.log('WHOIS lookup failed:', error.message);
            return { ownerName: null, ownerEmail: null, sources: [] };
        }
    }

    /**
     * Extract owner information from HTML content
     */
    extractOwnerFromContent(html, businessName) {
        const ownerData = {
            ownerName: null,
            ownerEmail: null,
            ownerPhone: null,
            sources: ['content_extraction']
        };

        try {
            // Remove HTML tags for text analysis
            const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').toLowerCase();

            // Email pattern
            const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
            const emails = text.match(emailPattern);
            
            if (emails && emails.length > 0) {
                // Filter out common generic emails
                const personalEmails = emails.filter(email => 
                    !email.includes('info@') &&
                    !email.includes('contact@') &&
                    !email.includes('support@') &&
                    !email.includes('admin@') &&
                    !email.includes('sales@')
                );
                
                if (personalEmails.length > 0) {
                    ownerData.ownerEmail = personalEmails[0];
                }
            }

            // Phone pattern
            const phonePattern = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
            const phones = text.match(phonePattern);
            if (phones && phones.length > 0) {
                ownerData.ownerPhone = phones[0];
            }

            // Owner name patterns
            const ownerPatterns = [
                /owner[:\s]+([a-zA-Z\s]{2,30})/i,
                /founder[:\s]+([a-zA-Z\s]{2,30})/i,
                /president[:\s]+([a-zA-Z\s]{2,30})/i,
                /ceo[:\s]+([a-zA-Z\s]{2,30})/i,
                /proprietor[:\s]+([a-zA-Z\s]{2,30})/i,
                /established by[:\s]+([a-zA-Z\s]{2,30})/i
            ];

            for (const pattern of ownerPatterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                    ownerData.ownerName = this.cleanOwnerName(match[1]);
                    break;
                }
            }

            return ownerData;

        } catch (error) {
            console.error('Content extraction failed:', error.message);
            return ownerData;
        }
    }

    /**
     * Utility methods
     */
    cleanUrl(url) {
        try {
            if (!url.startsWith('http')) {
                url = 'https://' + url;
            }
            return new URL(url).href;
        } catch {
            return null;
        }
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return null;
        }
    }

    cleanOwnerName(name) {
        return name.trim()
            .replace(/[^a-zA-Z\s]/g, '')
            .replace(/\s+/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    async fetchPageContent(url) {
        try {
            const response = await fetch(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.text();

        } catch (error) {
            console.log(`Failed to fetch ${url}: ${error.message}`);
            return null;
        }
    }

    mergeOwnerData(target, source) {
        if (source.ownerName && !target.ownerName) {
            target.ownerName = source.ownerName;
        }
        if (source.ownerEmail && !target.ownerEmail) {
            target.ownerEmail = source.ownerEmail;
        }
        if (source.ownerPhone && !target.ownerPhone) {
            target.ownerPhone = source.ownerPhone;
        }
        if (source.ownerLinkedIn && !target.ownerLinkedIn) {
            target.ownerLinkedIn = source.ownerLinkedIn;
        }
        if (source.sources) {
            target.sources = [...(target.sources || []), ...source.sources];
        }
    }

    calculateConfidence(ownerInfo) {
        let score = 0;
        
        if (ownerInfo.ownerName) score += 30;
        if (ownerInfo.ownerEmail) score += 35;
        if (ownerInfo.ownerPhone) score += 25;
        if (ownerInfo.ownerLinkedIn) score += 10;
        
        // Bonus for multiple sources
        const uniqueSources = [...new Set(ownerInfo.sources || [])];
        if (uniqueSources.length > 1) score += 10;
        
        return Math.min(score, 100);
    }
}

module.exports = OwnerDiscovery;