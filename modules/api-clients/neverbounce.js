const axios = require('axios');

class NeverBounceClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.neverbounce.com/v4';
    this.requestCount = 0;
    this.monthlyLimit = 2500; // Increased for non-optional usage
    this.costPerRequest = 0.008; // ~$0.008 per verification
    this.dailyBudget = 5.00; // $5 daily budget
    this.dailySpend = 0;
    this.priorityQueue = [];
  }

  async verifyEmail(email) {
    // Smart verification - only verify high-priority emails
    if (!this.canMakeRequest() || !this.shouldVerifyEmail(email)) {
      return this.getFallbackVerification(email);
    }

    try {
      console.log(`📧 Verifying email deliverability: ${email}`);
      
      const response = await axios.get(`${this.baseUrl}/single/check`, {
        params: {
          key: this.apiKey,
          email: email,
          timeout: 15 // Reasonable timeout
        }
      });

      this.trackRequest();

      if (response.data.status === 'success') {
        const result = response.data.result;
        
        return {
          email: email,
          result: result,
          flags: response.data.flags || [],
          suggested_correction: response.data.suggested_correction,
          isDeliverable: this.isResultDeliverable(result),
          confidence: this.calculateConfidence(result, response.data.flags),
          verifiedAt: new Date().toISOString(),
          source: 'NeverBounce',
          cost: this.costPerRequest
        };
      }

      return this.getFallbackVerification(email);

    } catch (error) {
      console.error(`NeverBounce verification failed for ${email}:`, error.message);
      return this.getFallbackVerification(email, error.message);
    }
  }

  async verifyEmailBatch(emails) {
    // Smart batch processing - prioritize high-value emails
    const priorityEmails = this.prioritizeEmails(emails);
    const results = [];
    
    for (const email of priorityEmails) {
      if (!this.canMakeRequest()) {
        // Add remaining emails as fallback results
        results.push(this.getFallbackVerification(email));
        continue;
      }

      try {
        const result = await this.verifyEmail(email);
        results.push(result);
        
        // Small delay to be API-friendly
        await this.delay(50);
        
      } catch (error) {
        console.error(`Batch verification failed for ${email}:`, error.message);
        results.push(this.getFallbackVerification(email, error.message));
      }
    }

    return results;
  }

  /**
   * Prioritize emails for verification based on business value
   */
  prioritizeEmails(emails) {
    return emails.sort((a, b) => {
      const scoreA = this.getEmailPriorityScore(a);
      const scoreB = this.getEmailPriorityScore(b);
      return scoreB - scoreA; // Higher scores first
    });
  }

  /**
   * Calculate priority score for email verification
   */
  getEmailPriorityScore(email) {
    let score = 50; // Base score
    const address = email.toLowerCase();
    
    // High priority patterns
    if (address.includes('owner') || address.includes('ceo') || address.includes('president')) {
      score += 30;
    }
    if (address.includes('manager') || address.includes('director')) {
      score += 20;
    }
    if (address.includes('admin') || address.includes('office')) {
      score += 15;
    }
    
    // Low priority patterns
    if (address.includes('noreply') || address.includes('donotreply')) {
      score -= 40;
    }
    if (address.includes('info') || address.includes('contact')) {
      score -= 10;
    }
    if (address.includes('support') || address.includes('help')) {
      score -= 15;
    }
    
    // Personal email patterns get medium priority
    if (address.split('@')[0].includes('.')) {
      score += 10;
    }
    
    return score;
  }

  /**
   * Determine if email should be verified based on patterns and budget
   */
  shouldVerifyEmail(email) {
    const priorityScore = this.getEmailPriorityScore(email);
    const budgetThreshold = (this.dailySpend / this.dailyBudget) * 100;
    
    // As budget depletes, be more selective
    if (budgetThreshold > 80) {
      return priorityScore > 70; // Only high priority
    } else if (budgetThreshold > 60) {
      return priorityScore > 60; // Medium+ priority
    } else {
      return priorityScore > 40; // Most emails except obvious low priority
    }
  }

  /**
   * Check if we can make another API request
   */
  canMakeRequest() {
    return this.requestCount < this.monthlyLimit && this.dailySpend < this.dailyBudget;
  }

  /**
   * Track API usage and costs
   */
  trackRequest() {
    this.requestCount++;
    this.dailySpend += this.costPerRequest;
  }

  /**
   * Determine if result indicates deliverable email
   */
  isResultDeliverable(result) {
    return result === 'valid' || result === 'catchall';
  }

  /**
   * Calculate confidence score based on NeverBounce results
   */
  calculateConfidence(result, flags = []) {
    let confidence = 0;
    
    switch (result) {
      case 'valid':
        confidence = 95;
        break;
      case 'catchall':
        confidence = 75;
        break;
      case 'unknown':
        confidence = 50;
        break;
      case 'disposable':
        confidence = 15;
        break;
      case 'invalid':
        confidence = 5;
        break;
      default:
        confidence = 30;
    }

    // Adjust based on flags
    flags.forEach(flag => {
      switch (flag) {
        case 'has_dns':
        case 'has_dns_mx':
          confidence += 5;
          break;
        case 'smtp_connectable':
          confidence += 10;
          break;
        case 'role_account':
          confidence -= 10;
          break;
        case 'free_email_host':
          confidence -= 5;
          break;
        case 'disposable':
          confidence -= 20;
          break;
      }
    });

    return Math.min(Math.max(confidence, 0), 100);
  }

  /**
   * Provide fallback when API is unavailable
   */
  getFallbackVerification(email, error = null) {
    // Basic email format validation as fallback
    const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const hasObviousIssues = email.includes('noreply') || email.includes('donotreply');
    
    return {
      email: email,
      result: 'unknown',
      isDeliverable: isValidFormat && !hasObviousIssues,
      confidence: isValidFormat ? (hasObviousIssues ? 20 : 40) : 10,
      verifiedAt: new Date().toISOString(),
      source: 'NeverBounce (Unavailable)',
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
      source: 'NeverBounce'
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = NeverBounceClient;

  async verifyEmailBatch(emails) {
    // For batch verification - useful for processing multiple emails at once
    if (this.requestCount + emails.length > this.monthlyLimit) {
      throw new Error(`NeverBounce batch would exceed monthly limit. Remaining: ${this.getRemainingRequests()}`);
    }

    const results = [];
    
    // Process emails one by one to avoid overwhelming the API
    for (const email of emails) {
      try {
        const result = await this.verifyEmail(email);
        results.push(result);
        
        // Small delay between requests to be respectful
        await this.delay(100);
        
      } catch (error) {
        console.error(`Batch verification failed for ${email}:`, error.message);
        results.push({
          email: email,
          result: 'error',
          error: error.message,
          isDeliverable: false,
          confidence: 0
        });
      }
    }

    return results;
  }

  calculateConfidence(result, flags = []) {
    let confidence = 0;
    
    switch (result) {
      case 'valid':
        confidence = 95;
        break;
      case 'catchall':
        confidence = 75;
        break;
      case 'unknown':
        confidence = 50;
        break;
      case 'disposable':
        confidence = 10;
        break;
      case 'invalid':
        confidence = 5;
        break;
      default:
        confidence = 0;
    }

    // Adjust based on flags
    flags.forEach(flag => {
      switch (flag) {
        case 'has_dns':
          confidence += 5;
          break;
        case 'has_dns_mx':
          confidence += 5;
          break;
        case 'smtp_connectable':
          confidence += 10;
          break;
        case 'role_account':
          confidence -= 10; // info@, contact@ etc are less valuable
          break;
        case 'free_email_host':
          confidence -= 5; // gmail, yahoo etc
          break;
      }
    });

    return Math.min(Math.max(confidence, 0), 100); // Clamp between 0-100
  }

  isEmailDeliverable(verificationResult) {
    if (!verificationResult) return false;
    
    return verificationResult.result === 'valid' && 
           verificationResult.confidence >= 80;
  }

  getRemainingRequests() {
    return Math.max(0, this.monthlyLimit - this.requestCount);
  }

  getUsageStats() {
    return {
      used: this.requestCount,
      remaining: this.getRemainingRequests(),
      limit: this.monthlyLimit,
      usagePercentage: Math.round((this.requestCount / this.monthlyLimit) * 100)
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = NeverBounceClient;