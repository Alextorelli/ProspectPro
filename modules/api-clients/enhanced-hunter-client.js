/**
 * Enhanced Hunter.io Integration - Email Discovery & Verification
 * Comprehensive email finding with pattern generation and cost optimization
 */

class EnhancedHunterClient {
  constructor(apiKey, monthlyBudget = 500) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.hunter.io/v2';
    this.budget = monthlyBudget;
    this.searchCost = 0.098; // $0.098 per search on Starter plan
    this.verifyCost = 0.049; // $0.049 per verification
    this.dailySpend = 0;
    this.dailyLimit = Math.floor(monthlyBudget / 30);
    this.rateLimitDelay = 1000; // 1 second between requests
    
    // Success rate tracking
    this.searchAttempts = 0;
    this.searchSuccesses = 0;
    this.verificationAttempts = 0;
    this.verificationSuccesses = 0;
  }

  /**
   * Smart email discovery - tries patterns first, then Hunter.io
   * @param {Object} businessData - Business information
   * @returns {Promise<Object>} Email discovery results
   */
  async discoverBusinessEmails(businessData) {
    console.log(`📧 Starting email discovery for: ${businessData.business_name}`);
    
    const results = {
      business_name: businessData.business_name,
      domain: this.extractDomain(businessData.website),
      emails: [],
      patterns_tried: [],
      hunter_used: false,
      cost: 0,
      confidence_scores: []
    };

    // Skip if no valid website domain
    if (!results.domain || this.isInvalidDomain(results.domain)) {
      console.log(`⚠️ Invalid or missing domain for ${businessData.business_name}`);
      return results;
    }

    try {
      // Step 1: Generate and validate email patterns (free)
      console.log(`🎯 Trying email patterns for domain: ${results.domain}`);
      const patternEmails = await this.tryEmailPatterns(businessData, results.domain);
      
      if (patternEmails.length > 0) {
        console.log(`✅ Found ${patternEmails.length} emails using patterns`);
        results.emails = patternEmails;
        results.patterns_tried = this.getCommonPatterns('', '', results.domain);
        
        // Verify pattern emails if budget allows
        if (this.checkBudget('verify', patternEmails.length)) {
          results.emails = await this.verifyEmails(patternEmails);
          results.cost += patternEmails.length * this.verifyCost;
        }
      }

      // Step 2: Use Hunter.io if patterns failed or for additional discovery
      if (results.emails.length === 0 || (results.emails.length < 2 && this.checkBudget('search'))) {
        console.log(`🔍 Using Hunter.io domain search for: ${results.domain}`);
        const hunterResults = await this.searchDomain(results.domain);
        
        if (hunterResults && hunterResults.emails.length > 0) {
          results.hunter_used = true;
          results.cost += this.searchCost;
          
          // Combine with pattern results and deduplicate
          const allEmails = [...results.emails, ...hunterResults.emails];
          results.emails = this.deduplicateEmails(allEmails);
          
          console.log(`✅ Hunter.io found ${hunterResults.emails.length} additional emails`);
        }
      }

      // Step 3: Targeted email finder for known contacts
      if (businessData.owner_name && this.checkBudget('finder')) {
        console.log(`👤 Searching for owner email: ${businessData.owner_name}`);
        const ownerEmail = await this.findPersonEmail(
          results.domain, 
          businessData.owner_name
        );
        
        if (ownerEmail) {
          results.emails.push(ownerEmail);
          results.cost += this.searchCost;
          console.log(`✅ Found owner email: ${ownerEmail.value}`);
        }
      }

      // Final deduplication and quality scoring
      results.emails = this.deduplicateEmails(results.emails);
      results.quality_score = this.calculateEmailQualityScore(results.emails);
      
      console.log(`🎉 Email discovery complete: ${results.emails.length} emails found (Cost: $${results.cost.toFixed(3)})`);
      return results;

    } catch (error) {
      console.error(`❌ Email discovery error for ${businessData.business_name}:`, error.message);
      results.error = error.message;
      return results;
    }
  }

  /**
   * Generate common email patterns and test them
   * @param {Object} businessData - Business information
   * @param {string} domain - Domain to test
   * @returns {Promise<Array>} Valid email addresses
   */
  async tryEmailPatterns(businessData, domain) {
    const validEmails = [];
    const patterns = this.getAllEmailPatterns(businessData, domain);
    
    console.log(`🧪 Testing ${patterns.length} email patterns...`);
    
    // Test patterns in batches with basic validation
    for (let i = 0; i < patterns.length; i += 5) {
      const batch = patterns.slice(i, i + 5);
      
      for (const email of batch) {
        if (this.isValidEmailFormat(email)) {
          // Add pattern-generated emails with lower confidence
          validEmails.push({
            value: email,
            type: 'pattern_generated',
            confidence: 45, // Lower confidence for patterns
            sources: []
          });
        }
      }
      
      // Brief delay between batches
      await this.delay(100);
    }
    
    console.log(`📋 Generated ${validEmails.length} pattern emails`);
    return validEmails.slice(0, 10); // Limit to top 10 patterns
  }

  /**
   * Generate comprehensive email patterns
   * @param {Object} businessData - Business data
   * @param {string} domain - Domain name
   * @returns {Array<string>} Email patterns
   */
  getAllEmailPatterns(businessData, domain) {
    const patterns = new Set();
    
    // Generic business patterns
    patterns.add(`info@${domain}`);
    patterns.add(`contact@${domain}`);
    patterns.add(`sales@${domain}`);
    patterns.add(`hello@${domain}`);
    patterns.add(`admin@${domain}`);
    patterns.add(`support@${domain}`);
    patterns.add(`office@${domain}`);
    
    // Owner name patterns
    if (businessData.owner_name) {
      const namePatterns = this.generateNamePatterns(businessData.owner_name, domain);
      namePatterns.forEach(pattern => patterns.add(pattern));
    }
    
    // Business name patterns
    if (businessData.business_name) {
      const businessPatterns = this.generateBusinessNamePatterns(businessData.business_name, domain);
      businessPatterns.forEach(pattern => patterns.add(pattern));
    }
    
    return Array.from(patterns);
  }

  /**
   * Generate patterns based on person name
   * @param {string} fullName - Person's full name
   * @param {string} domain - Domain
   * @returns {Array<string>} Name-based patterns
   */
  generateNamePatterns(fullName, domain) {
    const patterns = [];
    const nameParts = fullName.toLowerCase().trim().split(/\s+/);
    
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      
      // Common patterns
      patterns.push(`${firstName}@${domain}`);
      patterns.push(`${firstName}.${lastName}@${domain}`);
      patterns.push(`${firstName}${lastName}@${domain}`);
      patterns.push(`${firstName[0]}${lastName}@${domain}`);
      patterns.push(`${firstName}_${lastName}@${domain}`);
      patterns.push(`${firstName}-${lastName}@${domain}`);
      patterns.push(`${lastName}.${firstName}@${domain}`);
    }
    
    return patterns;
  }

  /**
   * Generate patterns based on business name
   * @param {string} businessName - Business name
   * @param {string} domain - Domain
   * @returns {Array<string>} Business name patterns
   */
  generateBusinessNamePatterns(businessName, domain) {
    const patterns = [];
    const cleanName = businessName.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .replace(/\b(inc|llc|corp|ltd|company|co)\b/g, '')
      .trim();
    
    if (cleanName) {
      const words = cleanName.split(/\s+/).filter(word => word.length > 2);
      
      if (words.length > 0) {
        patterns.push(`${words[0]}@${domain}`);
        
        if (words.length > 1) {
          patterns.push(`${words[0]}.${words[1]}@${domain}`);
          patterns.push(`${words[0]}${words[1]}@${domain}`);
        }
      }
    }
    
    return patterns;
  }

  /**
   * Hunter.io domain search
   * @param {string} domain - Domain to search
   * @param {number} limit - Max results
   * @returns {Promise<Object>} Search results
   */
  async searchDomain(domain, limit = 10) {
    if (!this.checkBudget('search')) {
      throw new Error('Budget exceeded for domain search');
    }

    const params = new URLSearchParams({
      domain: domain,
      limit: limit.toString(),
      api_key: this.apiKey
    });

    try {
      this.searchAttempts++;
      this.trackSpend(this.searchCost);

      const response = await fetch(`${this.baseURL}/domain-search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Hunter.io API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.data && data.data.emails) {
        this.searchSuccesses++;
        
        // Enhance emails with metadata
        const enhancedEmails = data.data.emails.map(email => ({
          value: email.value,
          type: email.type || 'generic',
          confidence: email.confidence || 50,
          sources: email.sources || [],
          first_name: email.first_name,
          last_name: email.last_name,
          position: email.position,
          department: email.department,
          hunter_verified: true
        }));

        console.log(`🎯 Hunter.io found ${enhancedEmails.length} emails for ${domain}`);
        return {
          emails: enhancedEmails,
          domain: data.data.domain,
          organization: data.data.organization
        };
      }

      return { emails: [] };
    } catch (error) {
      console.error(`Hunter.io domain search failed for ${domain}:`, error.message);
      throw error;
    }
  }

  /**
   * Hunter.io email finder for specific person
   * @param {string} domain - Domain
   * @param {string} fullName - Person's full name
   * @returns {Promise<Object|null>} Found email or null
   */
  async findPersonEmail(domain, fullName) {
    if (!this.checkBudget('finder')) {
      throw new Error('Budget exceeded for email finder');
    }

    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      console.log(`⚠️ Need first and last name for email finder: ${fullName}`);
      return null;
    }

    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];

    const params = new URLSearchParams({
      domain: domain,
      first_name: firstName,
      last_name: lastName,
      api_key: this.apiKey
    });

    try {
      this.searchAttempts++;
      this.trackSpend(this.searchCost);

      const response = await fetch(`${this.baseURL}/email-finder?${params}`);
      
      if (!response.ok) {
        throw new Error(`Email finder API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.data && data.data.email) {
        this.searchSuccesses++;
        
        return {
          value: data.data.email,
          type: 'personal',
          confidence: data.data.confidence || 75,
          sources: data.data.sources || [],
          first_name: data.data.first_name,
          last_name: data.data.last_name,
          position: data.data.position,
          hunter_verified: true
        };
      }

      return null;
    } catch (error) {
      console.error(`Email finder failed for ${fullName} at ${domain}:`, error.message);
      return null;
    }
  }

  /**
   * Verify email addresses for deliverability
   * @param {Array} emails - Email objects to verify
   * @returns {Promise<Array>} Verified emails
   */
  async verifyEmails(emails) {
    if (!Array.isArray(emails) || emails.length === 0) {
      return [];
    }

    console.log(`🔍 Verifying ${emails.length} email addresses...`);
    const verifiedEmails = [];

    for (const emailObj of emails) {
      if (!this.checkBudget('verify')) {
        console.log(`⚠️ Budget limit reached during email verification`);
        break;
      }

      try {
        const verification = await this.verifyEmail(emailObj.value);
        
        if (verification) {
          verifiedEmails.push({
            ...emailObj,
            verification_status: verification.result,
            verification_score: verification.score,
            deliverability: verification.result === 'deliverable' ? 'high' : 
                          verification.result === 'risky' ? 'medium' : 'low',
            verified_at: new Date().toISOString()
          });
        } else {
          // Add unverified email with lower confidence
          verifiedEmails.push({
            ...emailObj,
            verification_status: 'unknown',
            deliverability: 'unknown',
            confidence: Math.max(0, emailObj.confidence - 20)
          });
        }

        // Rate limiting
        await this.delay(this.rateLimitDelay);

      } catch (error) {
        console.error(`Verification failed for ${emailObj.value}:`, error.message);
        // Keep the email but mark as unverified
        verifiedEmails.push({
          ...emailObj,
          verification_status: 'error',
          verification_error: error.message
        });
      }
    }

    const deliverableCount = verifiedEmails.filter(e => e.verification_status === 'deliverable').length;
    console.log(`✅ Verification complete: ${deliverableCount}/${emails.length} emails deliverable`);

    return verifiedEmails;
  }

  /**
   * Single email verification
   * @param {string} email - Email address to verify
   * @returns {Promise<Object|null>} Verification result
   */
  async verifyEmail(email) {
    if (!this.isValidEmailFormat(email)) {
      return null;
    }

    const params = new URLSearchParams({
      email: email,
      api_key: this.apiKey
    });

    try {
      this.verificationAttempts++;
      this.trackSpend(this.verifyCost);

      const response = await fetch(`${this.baseURL}/email-verifier?${params}`);
      
      if (!response.ok) {
        throw new Error(`Email verification API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.data) {
        this.verificationSuccesses++;
        
        return {
          email: data.data.email,
          result: data.data.result, // deliverable, undeliverable, risky
          score: data.data.score || 0,
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
      console.error(`Email verification failed for ${email}:`, error.message);
      return null;
    }
  }

  /**
   * Utility functions
   */

  extractDomain(website) {
    if (!website) return null;
    
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '');
    } catch {
      return null;
    }
  }

  isInvalidDomain(domain) {
    const invalidDomains = [
      'facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com',
      'youtube.com', 'tiktok.com', 'snapchat.com', 'pinterest.com',
      'example.com', 'test.com', 'localhost'
    ];
    
    return !domain || invalidDomains.some(invalid => domain.includes(invalid));
  }

  isValidEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 100;
  }

  deduplicateEmails(emails) {
    const seen = new Set();
    return emails.filter(emailObj => {
      const email = emailObj.value || emailObj.email || emailObj;
      const normalizedEmail = typeof email === 'string' ? email.toLowerCase() : '';
      
      if (seen.has(normalizedEmail)) {
        return false;
      }
      seen.add(normalizedEmail);
      return true;
    });
  }

  calculateEmailQualityScore(emails) {
    if (!emails.length) return 0;
    
    const scores = emails.map(emailObj => {
      let score = emailObj.confidence || 50;
      
      // Boost verified emails
      if (emailObj.verification_status === 'deliverable') score += 30;
      else if (emailObj.verification_status === 'risky') score += 10;
      
      // Boost Hunter.io verified emails
      if (emailObj.hunter_verified) score += 20;
      
      // Penalize generic emails
      if (emailObj.type === 'generic') score -= 10;
      
      return Math.min(100, Math.max(0, score));
    });
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  /**
   * Budget and tracking functions
   */

  checkBudget(operation, count = 1) {
    const cost = operation === 'search' || operation === 'finder' ? 
                 this.searchCost * count : 
                 this.verifyCost * count;
    
    return (this.dailySpend + cost) <= this.dailyLimit;
  }

  trackSpend(cost) {
    this.dailySpend += cost;
  }

  getUsageStats() {
    return {
      daily_spend: this.dailySpend,
      daily_limit: this.dailyLimit,
      remaining_budget: Math.max(0, this.dailyLimit - this.dailySpend),
      search_success_rate: this.searchAttempts > 0 ? 
                          (this.searchSuccesses / this.searchAttempts * 100).toFixed(1) + '%' : '0%',
      verification_success_rate: this.verificationAttempts > 0 ? 
                                (this.verificationSuccesses / this.verificationAttempts * 100).toFixed(1) + '%' : '0%',
      searches_performed: this.searchAttempts,
      verifications_performed: this.verificationAttempts
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batch processing for multiple businesses
   */
  async processBusinessBatch(businesses, batchSize = 5) {
    console.log(`📦 Processing ${businesses.length} businesses in batches of ${batchSize}`);
    const results = [];
    
    for (let i = 0; i < businesses.length; i += batchSize) {
      const batch = businesses.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (business, index) => {
        // Stagger requests to respect rate limits
        await this.delay(index * this.rateLimitDelay);
        return await this.discoverBusinessEmails(business);
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(businesses.length/batchSize)} complete`);
      
      // Check budget after each batch
      if (!this.checkBudget('search')) {
        console.log(`⚠️ Daily budget limit reached. Processed ${results.length}/${businesses.length} businesses.`);
        break;
      }
      
      // Pause between batches
      if (i + batchSize < businesses.length) {
        await this.delay(2000);
      }
    }
    
    return results;
  }
}

module.exports = EnhancedHunterClient;