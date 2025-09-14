const axios = require('axios');

class HunterIOClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.hunter.io/v2';
    this.requestCount = 0;
    this.monthlyLimit = 25; // Free tier limit
  }

  async domainSearch(domain) {
    if (this.requestCount >= this.monthlyLimit) {
      throw new Error('Hunter.io monthly limit reached. Please upgrade plan or wait for next month.');
    }

    try {
      console.log(`🎯 Searching emails for domain: ${domain}`);
      
      const response = await axios.get(`${this.baseUrl}/domain-search`, {
        params: {
          domain: domain,
          api_key: this.apiKey,
          limit: 10
        }
      });

      this.requestCount++;

      if (response.data.data) {
        return {
          domain: domain,
          emails: response.data.data.emails || [],
          pattern: response.data.data.pattern,
          organization: response.data.data.organization,
          disposable: response.data.data.disposable,
          webmail: response.data.data.webmail,
          confidence: response.data.data.confidence || 0,
          sources: response.data.data.sources || []
        };
      }

      return null;

    } catch (error) {
      console.error(`Hunter.io domain search failed for ${domain}:`, error.message);
      
      if (error.response?.status === 429) {
        throw new Error('Hunter.io rate limit exceeded');
      }
      
      return null;
    }
  }

  async verifyEmail(email) {
    if (this.requestCount >= this.monthlyLimit) {
      throw new Error('Hunter.io monthly limit reached. Please upgrade plan or wait for next month.');
    }

    try {
      console.log(`✅ Verifying email: ${email}`);
      
      const response = await axios.get(`${this.baseUrl}/email-verifier`, {
        params: {
          email: email,
          api_key: this.apiKey
        }
      });

      this.requestCount++;

      if (response.data.data) {
        return {
          email: email,
          result: response.data.data.result, // deliverable, undeliverable, risky, unknown
          score: response.data.data.score || 0,
          regexp: response.data.data.regexp,
          gibberish: response.data.data.gibberish,
          disposable: response.data.data.disposable,
          webmail: response.data.data.webmail,
          mx_records: response.data.data.mx_records,
          smtp_server: response.data.data.smtp_server,
          smtp_check: response.data.data.smtp_check,
          accept_all: response.data.data.accept_all,
          block: response.data.data.block,
          sources: response.data.data.sources || []
        };
      }

      return null;

    } catch (error) {
      console.error(`Hunter.io email verification failed for ${email}:`, error.message);
      
      if (error.response?.status === 429) {
        throw new Error('Hunter.io rate limit exceeded');
      }
      
      return null;
    }
  }

  async generateEmailCandidates(firstName, lastName, domain) {
    // Generate common email patterns for a person at a domain
    const patterns = [
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}@${domain}`,
      `${lastName.toLowerCase()}@${domain}`,
      `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}@${domain}`,
      `${firstName.charAt(0).toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}.${lastName.charAt(0).toLowerCase()}@${domain}`
    ];

    // Remove duplicates and filter out invalid patterns
    return [...new Set(patterns)]
      .filter(email => email.length > 5 && email.includes('@'))
      .slice(0, 5); // Return top 5 candidates
  }

  async findPersonalEmails(businessName, ownerNames, domain) {
    const personalEmails = [];

    // Try to find personal emails for each owner/contact name
    for (const fullName of ownerNames) {
      const nameParts = fullName.trim().split(' ');
      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        
        const candidates = await this.generateEmailCandidates(firstName, lastName, domain);
        personalEmails.push(...candidates);
      }
    }

    return [...new Set(personalEmails)]; // Remove duplicates
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
}

module.exports = HunterIOClient;