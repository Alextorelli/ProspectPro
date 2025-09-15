const axios = require('axios');

class HunterIOClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.hunter.io/v2';
    this.requestCount = 0;
    this.monthlyLimit = 100; // Increased for non-optional usage
    this.costPerRequest = 0.04; // ~$0.04 per email search
    this.dailyBudget = 10.00; // $10 daily limit
    this.dailySpend = 0;
  }

  async domainSearch(domain) {
    // Cost-conscious request validation
    if (!this.canMakeRequest()) {
      console.warn('⚠️ Hunter.io request skipped - budget/limit reached');
      return this.getFallbackResult(domain);
    }

    try {
      console.log(`🎯 Searching emails for domain: ${domain}`);
      
      const response = await axios.get(`${this.baseUrl}/domain-search`, {
        params: {
          domain: domain,
          api_key: this.apiKey,
          limit: 5, // Reduced to optimize costs
          offset: 0,
          type: 'personal' // Focus on personal emails
        }
      });

      this.trackRequest();

      if (response.data.data) {
        const emails = this.filterHighQualityEmails(response.data.data.emails || []);
        
        return {
          domain: domain,
          emails: emails,
          pattern: response.data.data.pattern,
          organization: response.data.data.organization,
          confidence: response.data.data.confidence || 0,
          emailCount: emails.length,
          source: 'Hunter.io Domain Search',
          cost: this.costPerRequest
        };
      }

      return this.getFallbackResult(domain);

    } catch (error) {
      console.error(`Hunter.io domain search failed for ${domain}:`, error.message);
      return this.getFallbackResult(domain, error.message);
    }
  }

  async verifyEmail(email) {
    // Only verify high-priority emails to control costs
    if (!this.canMakeRequest() || !this.isPriorityEmail(email)) {
      return this.getFallbackVerification(email);
    }

    try {
      console.log(`✅ Verifying email: ${email}`);
      
      const response = await axios.get(`${this.baseUrl}/email-verifier`, {
        params: {
          email: email,
          api_key: this.apiKey
        }
      });

      this.trackRequest();

      if (response.data.data) {
        return {
          email: email,
          result: response.data.data.result,
          score: response.data.data.score || 0,
          deliverable: response.data.data.result === 'deliverable',
          confidence: this.mapScoreToConfidence(response.data.data.score),
          source: 'Hunter.io Email Verifier',
          cost: this.costPerRequest
        };
      }

      return this.getFallbackVerification(email);

    } catch (error) {
      console.error(`Hunter.io email verification failed for ${email}:`, error.message);
      return this.getFallbackVerification(email, error.message);
    }
  }

  /**
   * Filter emails to focus on high-quality contacts
   */
  filterHighQualityEmails(emails) {
    return emails
      .filter(email => {
        // Skip generic emails and focus on personal contacts
        const address = email.value.toLowerCase();
        const genericPatterns = ['info@', 'contact@', 'support@', 'sales@', 'admin@', 'no-reply@'];
        return !genericPatterns.some(pattern => address.includes(pattern));
      })
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0)) // Sort by confidence
      .slice(0, 3); // Limit to top 3 high-quality emails
  }

  /**
   * Determine if email is worth verifying based on patterns
   */
  isPriorityEmail(email) {
    const address = email.toLowerCase();
    const highPriorityPatterns = ['ceo@', 'owner@', 'president@', 'manager@'];
    const lowPriorityPatterns = ['noreply@', 'donotreply@', 'automated@'];
    
    if (lowPriorityPatterns.some(pattern => address.includes(pattern))) {
      return false;
    }
    
    return highPriorityPatterns.some(pattern => address.includes(pattern)) || 
           address.includes('admin') || 
           address.split('@')[0].includes('.');
  }

  /**
   * Check if we can make another API request within budget constraints
   */
  canMakeRequest() {
    const withinRequestLimit = this.requestCount < this.monthlyLimit;
    const withinBudget = this.dailySpend < this.dailyBudget;
    
    return withinRequestLimit && withinBudget;
  }

  /**
   * Track API request usage and costs
   */
  trackRequest() {
    this.requestCount++;
    this.dailySpend += this.costPerRequest;
  }

  /**
   * Map Hunter.io score to our confidence system
   */
  mapScoreToConfidence(score) {
    if (score >= 90) return 95;
    if (score >= 80) return 85;
    if (score >= 70) return 75;
    if (score >= 60) return 65;
    return 50;
  }

  /**
   * Provide fallback result when API unavailable
   */
  getFallbackResult(domain, error = null) {
    return {
      domain: domain,
      emails: [],
      confidence: 0,
      source: 'Hunter.io (Unavailable)',
      cost: 0,
      error: error,
      fallback: true
    };
  }

  /**
   * Provide fallback verification when API unavailable
   */
  getFallbackVerification(email, error = null) {
    return {
      email: email,
      result: 'unknown',
      score: 50,
      deliverable: null,
      confidence: 30,
      source: 'Hunter.io (Unavailable)',
      cost: 0,
      error: error,
      fallback: true
    };
  }

  getRemainingRequests() {
    return Math.max(0, this.monthlyLimit - this.requestCount);
  }

  getRemainingBudget() {
    return Math.max(0, this.dailyBudget - this.dailySpend);
  }

  getUsageStats() {
    return {
      requests_used: this.requestCount,
      requests_remaining: this.getRemainingRequests(),
      monthly_limit: this.monthlyLimit,
      daily_spend: this.dailySpend,
      daily_budget: this.dailyBudget,
      cost_per_request: this.costPerRequest,
      usage_percentage: Math.round((this.requestCount / this.monthlyLimit) * 100),
      source: 'Hunter.io'
    };
  }
}

module.exports = HunterIOClient;