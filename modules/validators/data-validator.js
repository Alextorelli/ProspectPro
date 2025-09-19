const axios = require('axios');
const dns = require('dns').promises;

class DataValidator {
  constructor(neverBounceClient) {
    this.neverBounceClient = neverBounceClient;
  }

  async validateBusiness(business) {
    console.log(`🔍 Validating business: ${business.name}`);
    
    const validation = {
      businessName: await this.validateBusinessName(business.name),
      address: await this.validateAddress(business.address),
      phone: await this.validatePhone(business.phone),
      website: await this.validateWebsite(business.website),
      email: await this.validateEmail(business.email)
    };

    const confidenceScore = this.calculateConfidenceScore(validation);
    const isQualified = this.determineIfQualified(validation, confidenceScore);

    return { isQualified, confidenceScore, validation };
  }

  async validateBusinessName(name) {
    if (!name || name.trim().length < 2) {
      return { isValid: false, reason: 'Name is empty or too short', confidence: 0 };
    }

    // Check for fake/generic patterns
    const fakePatterns = [
      /^(Test|Demo|Sample|Example|Business|Company)\s*(LLC|Inc|Co\.?|Ltd\.?)$/i,
      /^(Artisan|Downtown|Gourmet|Premium|Quality)\s*(Bistro|Café|Restaurant|Shop|Store)$/i,
      /^Business\s*\d+$/i,
      /^Company\s*(Name|Here)$/i
    ];

    for (const pattern of fakePatterns) {
      if (pattern.test(name.trim())) {
        return { 
          isValid: false, 
          reason: 'Name matches fake/generic pattern', 
          confidence: 0,
          pattern: pattern.toString()
        };
      }
    }

    // Check for quality indicators
    const hasSpecificWords = /\b(restaurant|cafe|bistro|shop|store|clinic|salon|gym|hotel|motel)\b/i.test(name);
    const hasLocation = /\b(north|south|east|west|downtown|main|street|avenue)\b/i.test(name);
    const hasNumbers = /\d/.test(name);

    let confidence = 70; // Base confidence
    if (hasSpecificWords) confidence += 15;
    if (hasLocation) confidence += 10;
    if (hasNumbers && !fakePatterns.some(p => p.test(name))) confidence += 5;

    return { 
      isValid: true, 
      confidence: Math.min(confidence, 100),
      hasSpecificWords,
      hasLocation,
      hasNumbers
    };
  }

  async validateAddress(address) {
    if (!address || address.trim().length < 10) {
      return { isValid: false, reason: 'Address is empty or too short', confidence: 0 };
    }

    // Check for fake sequential patterns
    const sequentialPattern = /^\d+\s+Main\s+(St|Street)/i;
    if (sequentialPattern.test(address)) {
      return { 
        isValid: false, 
        reason: 'Address matches fake sequential pattern (X Main St)', 
        confidence: 0 
      };
    }

    // Check for PO Box (not ideal for business addresses)
    const poBoxPattern = /P\.?O\.?\s*Box/i;
    if (poBoxPattern.test(address)) {
      return { 
        isValid: false, 
        reason: 'PO Box address not acceptable for business validation', 
        confidence: 30 
      };
    }

    // Validate basic address components
    const hasNumber = /^\d+/.test(address.trim());
    const hasStreetType = /\b(st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|way|ct|court)\b/i.test(address);
    const hasCity = /,\s*[A-Za-z\s]+/i.test(address);
    const hasState = /\b[A-Z]{2}\b/.test(address);
    const hasZip = /\d{5}(-\d{4})?/.test(address);

    let confidence = 0;
    if (hasNumber) confidence += 20;
    if (hasStreetType) confidence += 20;
    if (hasCity) confidence += 20;
    if (hasState) confidence += 20;
    if (hasZip) confidence += 20;

    return { 
      isValid: confidence >= 60, 
      confidence,
      hasNumber,
      hasStreetType,
      hasCity,
      hasState,
      hasZip,
      components: { hasNumber, hasStreetType, hasCity, hasState, hasZip }
    };
  }

  async validatePhone(phone) {
    if (!phone) {
      return { isValid: false, reason: 'Phone number is empty', confidence: 0 };
    }

    // Clean phone number
    const cleaned = phone.replace(/[^\d]/g, '');
    
    // Check for fake patterns
    const fakePatterns = [
      /^555\d{7}$/, // 555 numbers
      /^000\d{7}$/, // 000 numbers  
      /^111\d{7}$/, // 111 numbers
      /^123456789\d?$/, // Sequential numbers
      /^(\d)\1{9}$/ // All same digits
    ];

    for (const pattern of fakePatterns) {
      if (pattern.test(cleaned)) {
        return { 
          isValid: false, 
          reason: 'Phone matches fake pattern', 
          confidence: 0,
          pattern: pattern.toString()
        };
      }
    }

    // Validate US phone number format
    if (cleaned.length !== 10) {
      return { 
        isValid: false, 
        reason: 'Phone number must be 10 digits', 
        confidence: 20 
      };
    }

    // Check area code validity (basic check)
    const areaCode = cleaned.slice(0, 3);
    if (areaCode === '000' || areaCode === '555' || areaCode === '911') {
      return { 
        isValid: false, 
        reason: 'Invalid area code', 
        confidence: 10 
      };
    }

    const formatted = `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    
    return { 
      isValid: true, 
      confidence: 90,
      formatted,
      cleaned,
      areaCode
    };
  }

  async validateWebsite(website) {
    if (!website) {
      return { isValid: false, reason: 'Website URL is empty', confidence: 0 };
    }

    // Clean and normalize URL
    let url = website.toLowerCase().trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Check for placeholder/fake domains
    const fakeDomains = [
      'example.com', 'test.com', 'demo.com', 'sample.com',
      'placeholder.com', 'tempsite.com', 'artisanbistro.com',
      'downtowncaf.net', 'gourmetrestaurant.org'
    ];

    try {
      const urlObj = new URL(url);
      
      if (fakeDomains.includes(urlObj.hostname)) {
        return { 
          isValid: false, 
          reason: 'URL uses fake/placeholder domain', 
          confidence: 0 
        };
      }

      // Test if website is accessible
      console.log(`🌐 Testing website accessibility: ${url}`);
      
      const response = await axios.head(url, {
        timeout: 10000,
        validateStatus: (status) => status < 500 // Accept redirects, but not server errors
      });

      const isAccessible = response.status >= 200 && response.status < 400;
      const confidence = isAccessible ? 95 : 50;

      return { 
        isValid: isAccessible, 
        confidence,
        url,
        statusCode: response.status,
        responseTime: response.headers['x-response-time'] || 'unknown',
        accessible: isAccessible
      };

    } catch (error) {
      console.error(`Website validation failed for ${url}:`, error.message);
      
      // Check if it's a DNS issue vs server issue
      try {
        const urlObj = new URL(url);
        await dns.lookup(urlObj.hostname);
        
        // DNS works but server doesn't respond
        return { 
          isValid: false, 
          reason: 'Website server not responding', 
          confidence: 30,
          error: error.message
        };
        
      } catch (dnsError) {
        // DNS doesn't resolve
        return { 
          isValid: false, 
          reason: 'Website domain does not exist', 
          confidence: 0,
          error: dnsError.message
        };
      }
    }
  }

  async validateEmail(email) {
    if (!email) {
      return { isValid: false, reason: 'Email address is empty', confidence: 0 };
    }

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { 
        isValid: false, 
        reason: 'Invalid email format', 
        confidence: 0 
      };
    }

    // Check for fake/test patterns
    const fakePatterns = [
      /@example\.com$/i,
      /@test\.com$/i,
      /@demo\.com$/i,
      /test@/i,
      /demo@/i,
      /fake@/i
    ];

    for (const pattern of fakePatterns) {
      if (pattern.test(email)) {
        return { 
          isValid: false, 
          reason: 'Email uses fake/test pattern', 
          confidence: 0 
        };
      }
    }

    // Use NeverBounce for deliverability check if available
    if (this.neverBounceClient) {
      try {
        const verification = await this.neverBounceClient.verifyEmail(email);
        if (verification) {
          return {
            isValid: verification.isDeliverable,
            confidence: verification.confidence,
            result: verification.result,
            flags: verification.flags,
            deliverable: verification.isDeliverable,
            verificationService: 'NeverBounce'
          };
        }
      } catch (error) {
        console.error(`Email verification failed for ${email}:`, error.message);
      }
    }

    // Fallback to basic validation if NeverBounce fails
    const domain = email.split('@')[1];
    let confidence = 60; // Base confidence for valid format

    // Prefer business domains over webmail
    const webmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    if (!webmailDomains.includes(domain)) {
      confidence += 20; // Business domain bonus
    }

    // Prefer specific emails over generic
    const genericPrefixes = ['info', 'contact', 'admin', 'hello', 'support'];
    const prefix = email.split('@')[0].toLowerCase();
    if (!genericPrefixes.includes(prefix)) {
      confidence += 10; // Personal/specific email bonus
    }

    return { 
      isValid: true, 
      confidence,
      domain,
      prefix,
      isWebmail: webmailDomains.includes(domain),
      isGeneric: genericPrefixes.includes(prefix)
    };
  }

  calculateConfidenceScore(validation) {
    let score = 0;
    
    // Business Name: 20 points
    if (validation.businessName.isValid) {
      score += Math.round(validation.businessName.confidence * 0.2);
    }
    
    // Address: 20 points
    if (validation.address.isValid) {
      score += Math.round(validation.address.confidence * 0.2);
    }
    
    // Phone: 25 points
    if (validation.phone.isValid) {
      score += Math.round(validation.phone.confidence * 0.25);
    }
    
    // Website: 15 points
    if (validation.website.isValid) {
      score += Math.round(validation.website.confidence * 0.15);
    }
    
    // Email: 20 points
    if (validation.email.isValid) {
      score += Math.round(validation.email.confidence * 0.2);
    }
    
    return Math.min(score, 100);
  }

  determineIfQualified(validation, confidenceScore) {
    // Require ALL critical fields to be valid
    const allCriticalValid = 
      validation.businessName.isValid &&
      validation.address.isValid &&
      validation.phone.isValid &&
      validation.website.isValid &&
      validation.email.isValid;
    
    // Require minimum confidence threshold
    const meetsConfidenceThreshold = confidenceScore >= 80;
    
    return allCriticalValid && meetsConfidenceThreshold;
  }
}

module.exports = DataValidator;