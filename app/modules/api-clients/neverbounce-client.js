/**
 * NeverBounce API Client
 * 
 * Email verification and validation service
 * Free tier: 1,000 email verifications/month
 * Paid tiers start at ~$18/month for 5,000 verifications
 */

const fetch = require('node-fetch');

class NeverBounceClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.neverbounce.com/v4';
        this.apiKey = apiKey;
        this.monthlyQuota = 1000; // Free tier default
        this.verificationsThisMonth = 0;
    }

    /**
     * Verify a single email address
     */
    async verifyEmail(email) {
        try {
            console.log(`🔍 Verifying email with NeverBounce: ${email}`);

            if (!this.apiKey) {
                throw new Error('NeverBounce API key required');
            }

            if (this.verificationsThisMonth >= this.monthlyQuota) {
                throw new Error('NeverBounce monthly quota exceeded');
            }

            const url = `${this.baseUrl}/single/check`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'ProspectPro/1.0 (Lead Generation)'
                },
                body: JSON.stringify({
                    key: this.apiKey,
                    email: email,
                    address_info: 1,
                    credits_info: 1,
                    timeout: 15
                }),
                timeout: 20000
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('NeverBounce API key invalid');
                }
                if (response.status === 429) {
                    throw new Error('NeverBounce rate limit exceeded');
                }
                throw new Error(`NeverBounce API returned ${response.status}`);
            }

            const data = await response.json();
            this.verificationsThisMonth++;

            if (data.status === 'success') {
                return this.parseVerificationResult(data.result, email);
            } else {
                throw new Error(`NeverBounce verification failed: ${data.message}`);
            }

        } catch (error) {
            console.error('NeverBounce verification failed:', error);
            return {
                email: email,
                isValid: false,
                confidence: 0,
                result: 'unknown',
                error: error.message
            };
        }
    }

    /**
     * Verify multiple email addresses in batch
     */
    async verifyEmails(emails) {
        try {
            console.log(`🔍 Batch verifying ${emails.length} emails with NeverBounce`);

            if (!this.apiKey) {
                throw new Error('NeverBounce API key required');
            }

            if (this.verificationsThisMonth + emails.length > this.monthlyQuota) {
                throw new Error('NeverBounce monthly quota would be exceeded');
            }

            // For batch operations, we'll use single verification in sequence
            // Real implementation might use NeverBounce's batch upload API
            const results = [];
            
            for (const email of emails) {
                if (this.verificationsThisMonth < this.monthlyQuota) {
                    const result = await this.verifyEmail(email);
                    results.push(result);
                    
                    // Small delay between requests to be respectful
                    await this.delay(100);
                } else {
                    results.push({
                        email: email,
                        isValid: false,
                        confidence: 0,
                        result: 'quota_exceeded',
                        error: 'Monthly quota exceeded'
                    });
                }
            }

            return results;

        } catch (error) {
            console.error('NeverBounce batch verification failed:', error);
            return emails.map(email => ({
                email: email,
                isValid: false,
                confidence: 0,
                result: 'unknown',
                error: error.message
            }));
        }
    }

    /**
     * Get account credits and usage information
     */
    async getAccountInfo() {
        try {
            if (!this.apiKey) {
                throw new Error('NeverBounce API key required');
            }

            const url = `${this.baseUrl}/account/info`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'ProspectPro/1.0 (Lead Generation)'
                },
                body: JSON.stringify({
                    key: this.apiKey
                }),
                timeout: 10000
            });

            if (!response.ok) {
                throw new Error(`NeverBounce account info API returned ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status === 'success') {
                return {
                    creditsRemaining: data.credits_info.paid_credits_remaining,
                    freeCreditsRemaining: data.credits_info.free_credits_remaining,
                    subscriptionType: data.subscription_info.subscription_type,
                    monthlyAllowance: data.subscription_info.monthly_allowance
                };
            }

            return null;

        } catch (error) {
            console.error('NeverBounce account info failed:', error);
            return null;
        }
    }

    /**
     * Quick email syntax validation (doesn't count against quota)
     */
    validateEmailSyntax(email) {
        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                isValid: false,
                reason: 'Invalid email format',
                confidence: 0
            };
        }

        // Check for common invalid patterns
        const invalidPatterns = [
            /@test\./i,
            /@example\./i,
            /@domain\./i,
            /noreply|no-reply/i,
            /postmaster/i,
            /@localhost/i,
            /\.test$/i
        ];

        for (const pattern of invalidPatterns) {
            if (pattern.test(email)) {
                return {
                    isValid: false,
                    reason: 'Test or placeholder email',
                    confidence: 0
                };
            }
        }

        // Check domain has valid TLD
        const domain = email.split('@')[1];
        if (domain && domain.includes('.')) {
            const tld = domain.split('.').pop();
            if (tld && tld.length >= 2) {
                return {
                    isValid: true,
                    reason: 'Valid syntax',
                    confidence: 30 // Low confidence without full verification
                };
            }
        }

        return {
            isValid: false,
            reason: 'Invalid domain format',
            confidence: 0
        };
    }

    /**
     * Utility methods
     */
    parseVerificationResult(result, email) {
        const verification = {
            email: email,
            result: result.result,
            isValid: false,
            confidence: 0,
            flags: result.flags || [],
            suggestedCorrection: result.suggested_correction
        };

        // Map NeverBounce results to our format
        switch (result.result) {
            case 'valid':
                verification.isValid = true;
                verification.confidence = 95;
                break;
            case 'invalid':
                verification.isValid = false;
                verification.confidence = 5;
                break;
            case 'disposable':
                verification.isValid = false;
                verification.confidence = 10;
                break;
            case 'catchall':
                verification.isValid = true;
                verification.confidence = 60; // Lower confidence for catch-all
                break;
            case 'unknown':
            default:
                verification.isValid = false;
                verification.confidence = 25; // Unknown status
                break;
        }

        // Adjust confidence based on flags
        if (result.flags) {
            if (result.flags.includes('has_dns')) {
                verification.confidence += 10;
            }
            if (result.flags.includes('has_dns_mx')) {
                verification.confidence += 10;
            }
            if (result.flags.includes('smtp_connectable')) {
                verification.confidence += 15;
            }
        }

        // Cap confidence at 100
        verification.confidence = Math.min(verification.confidence, 100);

        return verification;
    }

    isHighConfidenceEmail(verificationResult) {
        return verificationResult.isValid && verificationResult.confidence >= 80;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getRemainingQuota() {
        return this.monthlyQuota - this.verificationsThisMonth;
    }

    setMonthlyQuota(quota) {
        this.monthlyQuota = quota;
    }

    resetMonthlyCounter() {
        this.verificationsThisMonth = 0;
    }
}

module.exports = NeverBounceClient;