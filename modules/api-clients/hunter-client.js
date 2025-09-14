/**
 * Hunter.io API Client
 * 
 * Email discovery and verification service
 * Free tier: 25 requests/month
 * Paid tiers start at ~$49/month for 1,000 requests
 */

const fetch = require('node-fetch');

class HunterClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.hunter.io/v2';
        this.apiKey = apiKey;
        this.monthlyQuota = 25; // Free tier default
        this.requestsThisMonth = 0;
    }

    /**
     * Find email addresses associated with a domain
     */
    async findDomainEmails(domain, firstName = null, lastName = null) {
        try {
            console.log(`📧 Searching Hunter.io for emails at domain: ${domain}`);

            if (!this.apiKey) {
                throw new Error('Hunter.io API key required');
            }

            if (this.requestsThisMonth >= this.monthlyQuota) {
                throw new Error('Hunter.io monthly quota exceeded');
            }

            // First, search for email patterns in the domain
            const domainSearch = await this.searchDomain(domain);
            
            const results = {
                emails: [],
                patterns: [],
                confidence: 0,
                sources: ['hunter_io']
            };

            if (domainSearch && domainSearch.emails) {
                results.emails = domainSearch.emails.filter(email => 
                    this.isRelevantEmail(email, firstName, lastName)
                );
                results.patterns = domainSearch.pattern ? [domainSearch.pattern] : [];
            }

            // If we have a name, try to find/verify specific email
            if (firstName && lastName && domainSearch && domainSearch.pattern) {
                const generatedEmails = this.generateEmailsFromPattern(
                    firstName, lastName, domain, domainSearch.pattern
                );

                for (const email of generatedEmails) {
                    if (this.requestsThisMonth < this.monthlyQuota) {
                        const verification = await this.verifyEmail(email);
                        if (verification && verification.result === 'deliverable') {
                            results.emails.push({
                                value: email,
                                type: 'personal',
                                confidence: verification.score,
                                sources: ['hunter_io_generated']
                            });
                        }
                    }
                }
            }

            // Calculate overall confidence
            if (results.emails.length > 0) {
                results.confidence = Math.max(...results.emails.map(e => e.confidence || 50));
            }

            console.log(`✅ Hunter.io search complete. Found ${results.emails.length} emails`);
            return results;

        } catch (error) {
            console.error('Hunter.io email search failed:', error);
            return {
                emails: [],
                patterns: [],
                confidence: 0,
                sources: [],
                error: error.message
            };
        }
    }

    /**
     * Search for all emails in a domain
     */
    async searchDomain(domain) {
        try {
            const url = `${this.baseUrl}/domain-search?domain=${domain}&api_key=${this.apiKey}&limit=10`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'ProspectPro/1.0 (Lead Generation)',
                    'Accept': 'application/json'
                },
                timeout: 15000
            });

            this.requestsThisMonth++;

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Hunter.io API key invalid');
                }
                if (response.status === 429) {
                    throw new Error('Hunter.io rate limit exceeded');
                }
                throw new Error(`Hunter.io API returned ${response.status}`);
            }

            const data = await response.json();
            
            if (data.data) {
                return {
                    emails: data.data.emails || [],
                    pattern: data.data.pattern,
                    organization: data.data.organization,
                    webmail: data.data.webmail
                };
            }

            return null;

        } catch (error) {
            console.error('Hunter.io domain search failed:', error);
            return null;
        }
    }

    /**
     * Verify a specific email address
     */
    async verifyEmail(email) {
        try {
            if (this.requestsThisMonth >= this.monthlyQuota) {
                return null;
            }

            const url = `${this.baseUrl}/email-verifier?email=${email}&api_key=${this.apiKey}`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'ProspectPro/1.0 (Lead Generation)',
                    'Accept': 'application/json'
                },
                timeout: 15000
            });

            this.requestsThisMonth++;

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            
            if (data.data) {
                return {
                    result: data.data.result, // deliverable, undeliverable, risky, unknown
                    score: data.data.score,
                    email: data.data.email,
                    regexp: data.data.regexp,
                    gibberish: data.data.gibberish,
                    disposable: data.data.disposable,
                    webmail: data.data.webmail,
                    mx_records: data.data.mx_records,
                    smtp_server: data.data.smtp_server,
                    smtp_check: data.data.smtp_check
                };
            }

            return null;

        } catch (error) {
            console.error('Hunter.io email verification failed:', error);
            return null;
        }
    }

    /**
     * Find email for a specific person at a domain
     */
    async findPersonEmail(domain, firstName, lastName) {
        try {
            if (this.requestsThisMonth >= this.monthlyQuota) {
                throw new Error('Hunter.io monthly quota exceeded');
            }

            const url = `${this.baseUrl}/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${this.apiKey}`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'ProspectPro/1.0 (Lead Generation)',
                    'Accept': 'application/json'
                },
                timeout: 15000
            });

            this.requestsThisMonth++;

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            
            if (data.data && data.data.email) {
                return {
                    email: data.data.email,
                    score: data.data.score,
                    sources: data.data.sources || []
                };
            }

            return null;

        } catch (error) {
            console.error('Hunter.io person email search failed:', error);
            return null;
        }
    }

    /**
     * Utility methods
     */
    isRelevantEmail(emailObj, firstName, lastName) {
        if (!emailObj || !emailObj.value) return false;
        
        const email = emailObj.value.toLowerCase();
        
        // Filter out generic emails
        const genericPrefixes = ['info', 'contact', 'support', 'admin', 'sales', 'marketing', 'hello', 'mail'];
        for (const prefix of genericPrefixes) {
            if (email.startsWith(prefix + '@')) {
                return false;
            }
        }

        // If we have a name, prefer emails that might match
        if (firstName && lastName) {
            const first = firstName.toLowerCase();
            const last = lastName.toLowerCase();
            
            if (email.includes(first) || email.includes(last) || 
                email.includes(first[0] + last) || email.includes(first + last[0])) {
                return true;
            }
        }

        // Include if it looks like a personal email
        return emailObj.type === 'personal' || emailObj.confidence > 50;
    }

    generateEmailsFromPattern(firstName, lastName, domain, pattern) {
        if (!pattern) return [];

        const first = firstName.toLowerCase();
        const last = lastName.toLowerCase();
        const firstInitial = first[0];
        const lastInitial = last[0];

        const emails = [];
        
        // Replace pattern variables
        const patterns = [
            pattern.replace('{first}', first).replace('{last}', last),
            pattern.replace('{first}', firstInitial).replace('{last}', last),
            pattern.replace('{first}', first).replace('{last}', lastInitial),
            pattern.replace('{first}', firstInitial).replace('{last}', lastInitial)
        ];

        for (const p of patterns) {
            const email = `${p}@${domain}`;
            if (this.isValidEmail(email)) {
                emails.push(email);
            }
        }

        return [...new Set(emails)]; // Remove duplicates
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    getRemainingQuota() {
        return this.monthlyQuota - this.requestsThisMonth;
    }

    setMonthlyQuota(quota) {
        this.monthlyQuota = quota;
    }

    resetMonthlyCounter() {
        this.requestsThisMonth = 0;
    }
}

module.exports = HunterClient;