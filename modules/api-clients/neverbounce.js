const axios = require('axios');

class NeverBounceClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.neverbounce.com/v4';
    this.requestCount = 0;
    this.monthlyLimit = 1000; // Free tier limit
  }

  async verifyEmail(email) {
    if (this.requestCount >= this.monthlyLimit) {
      throw new Error('NeverBounce monthly limit reached. Please upgrade plan or wait for next month.');
    }

    try {
      console.log(`📧 Verifying email deliverability: ${email}`);
      
      const response = await axios.get(`${this.baseUrl}/single/check`, {
        params: {
          key: this.apiKey,
          email: email
        }
      });

      this.requestCount++;

      if (response.data.status === 'success') {
        const result = response.data.result;
        
        return {
          email: email,
          result: result, // valid, invalid, disposable, catchall, unknown
          flags: response.data.flags || [],
          suggested_correction: response.data.suggested_correction,
          execution_time: response.data.execution_time,
          isDeliverable: result === 'valid',
          confidence: this.calculateConfidence(result, response.data.flags),
          verifiedAt: new Date().toISOString()
        };
      }

      return null;

    } catch (error) {
      console.error(`NeverBounce verification failed for ${email}:`, error.message);
      
      if (error.response?.status === 429) {
        throw new Error('NeverBounce rate limit exceeded');
      }
      
      return null;
    }
  }

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