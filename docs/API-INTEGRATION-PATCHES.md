# API Integration Patches for ProspectPro Real Data Implementation

## 🔧 Critical Patches Required

### Patch 1: Replace Fake Business Discovery
**File**: `api/business-discovery.js`
**Issue**: Currently generates fake businesses like "Artisan Bistro", "Downtown Café"
**Priority**: CRITICAL

```javascript
// REMOVE THIS FAKE DATA GENERATION:
const generateFakeBusinesses = (query, location, count) => {
  return [
    { name: "Artisan Bistro", address: "100 Main St, Austin, TX" }, // FAKE!
    { name: "Downtown Café", address: "110 Main St, Austin, TX" }   // FAKE!
  ];
};

// REPLACE WITH REAL API CALLS:
const discoverRealBusinesses = async (query, location, count) => {
  try {
    // Stage 1: Google Places Text Search
    const googleResults = await googlePlacesClient.textSearch({
      query: `${query} in ${location}`,
      type: 'establishment'
    });
    
    // Stage 2: Yellow Pages Scraping (backup/supplement)
    const yellowPagesResults = await yellowPagesScraper.search(query, location);
    
    // Stage 3: Merge and deduplicate
    const allBusinesses = mergeBusinessSources(googleResults, yellowPagesResults);
    
    // Stage 4: Pre-validate each business BEFORE expensive API calls  
    const preValidated = [];
    for (const business of allBusinesses) {
      const score = await preValidationScorer.score(business);
      if (score >= 70) { // Only proceed with high-scoring businesses
        preValidated.push({...business, preValidationScore: score});
      }
    }
    
    return preValidated.slice(0, count);
    
  } catch (error) {
    console.error('Real business discovery failed:', error);
    // CRITICAL: Never fallback to fake data
    throw new Error(`Business discovery failed: ${error.message}`);
  }
};
```

### Patch 2: Real Google Places Integration
**File**: `modules/api-clients/google-places.js`
**Issue**: No actual Google Places API calls
**Priority**: CRITICAL

```javascript
const axios = require('axios');

class GooglePlacesClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  async textSearch(params) {
    const url = `${this.baseUrl}/textsearch/json`;
    
    try {
      const response = await axios.get(url, {
        params: {
          query: params.query,
          key: this.apiKey,
          type: params.type || 'establishment'
        },
        timeout: 10000
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.results.map(place => ({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        priceLevel: place.price_level,
        types: place.types,
        geometry: place.geometry,
        source: 'google_places'
      }));

    } catch (error) {
      console.error('Google Places Text Search failed:', error.message);
      throw error;
    }
  }

  async getPlaceDetails(placeId) {
    const url = `${this.baseUrl}/details/json`;
    
    try {
      const response = await axios.get(url, {
        params: {
          place_id: placeId,
          fields: 'formatted_phone_number,website,opening_hours,reviews',
          key: this.apiKey
        },
        timeout: 10000
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places Details API error: ${response.data.status}`);
      }

      const result = response.data.result;
      return {
        phone: result.formatted_phone_number || null,
        website: result.website || null,
        hours: result.opening_hours?.weekday_text || null,
        reviews: result.reviews || []
      };

    } catch (error) {
      console.error('Google Places Details failed:', error.message);
      throw error;
    }
  }
}

module.exports = GooglePlacesClient;
```

### Patch 3: Real Website Scraping with Scrapingdog
**File**: `modules/api-clients/scrapingdog.js`
**Issue**: No actual website content extraction
**Priority**: HIGH

```javascript
const axios = require('axios');
const cheerio = require('cheerio');

class ScrapingdogClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.scrapingdog.com/scrape';
  }

  async scrapeWebsite(url) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          api_key: this.apiKey,
          url: url,
          dynamic: false
        },
        timeout: 15000
      });

      const html = response.data;
      return this.extractContactInfo(html, url);

    } catch (error) {
      console.error(`Website scraping failed for ${url}:`, error.message);
      return null;
    }
  }

  extractContactInfo(html, websiteUrl) {
    const $ = cheerio.load(html);
    const domain = new URL(websiteUrl).hostname;

    // Extract emails with quality filtering
    const emails = this.extractEmails($, domain);
    
    // Extract phone numbers
    const phones = this.extractPhones($);
    
    // Extract owner/contact names
    const contactNames = this.extractContactNames($);
    
    // Extract social media links
    const socialLinks = this.extractSocialLinks($);

    return {
      emails: emails,
      phones: phones,
      contactNames: contactNames,
      socialLinks: socialLinks,
      domain: domain,
      extractedAt: new Date().toISOString()
    };
  }

  extractEmails($, domain) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const text = $('body').text();
    const foundEmails = text.match(emailRegex) || [];

    // Prioritize domain-specific emails
    const domainEmails = foundEmails.filter(email => email.includes(domain));
    const otherEmails = foundEmails.filter(email => !email.includes(domain));

    // Filter out generic patterns
    const genericPatterns = ['info@', 'contact@', 'admin@', 'support@', 'sales@', 'hello@'];
    const qualityEmails = [...domainEmails, ...otherEmails].filter(email => {
      const lowerEmail = email.toLowerCase();
      return !genericPatterns.some(pattern => lowerEmail.includes(pattern));
    });

    return [...new Set(qualityEmails)]; // Remove duplicates
  }

  extractPhones($) {
    const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
    const text = $('body').text();
    const phones = text.match(phoneRegex) || [];
    
    // Clean and format phone numbers
    return phones.map(phone => phone.replace(/[^\d]/g, ''))
                .filter(phone => phone.length === 10)
                .map(phone => `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`);
  }

  extractContactNames($) {
    const namePatterns = [
      /(?:owner|founder|ceo|president|director)[\s:]*([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
      /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*(?:owner|founder|ceo|president|director))/gi,
      /owned by ([A-Z][a-z]+\s+[A-Z][a-z]+)/gi
    ];

    const text = $('body').text();
    const names = [];

    namePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const nameMatch = match.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
          if (nameMatch) {
            names.push(nameMatch[1].trim());
          }
        });
      }
    });

    return [...new Set(names)]; // Remove duplicates
  }

  extractSocialLinks($) {
    const socialPatterns = {
      linkedin: /linkedin\.com\/(?:in|company)\/([^\/\s]+)/gi,
      facebook: /facebook\.com\/([^\/\s]+)/gi,
      twitter: /twitter\.com\/([^\/\s]+)/gi,
      instagram: /instagram\.com\/([^\/\s]+)/gi
    };

    const links = {};
    const html = $('body').html();

    Object.entries(socialPatterns).forEach(([platform, pattern]) => {
      const matches = html.match(pattern);
      if (matches) {
        links[platform] = matches[0];
      }
    });

    return links;
  }
}

module.exports = ScrapingdogClient;
```

### Patch 4: Real Email Discovery with Hunter.io
**File**: `modules/api-clients/hunter-io.js`
**Issue**: No actual email discovery or verification
**Priority**: HIGH

```javascript
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
      throw new Error('Hunter.io monthly limit reached');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/domain-search`, {
        params: {
          domain: domain,
          api_key: this.apiKey,
          limit: 10
        },
        timeout: 10000
      });

      this.requestCount++;

      if (response.data.data) {
        return {
          domain: response.data.data.domain,
          emails: response.data.data.emails || [],
          pattern: response.data.data.pattern,
          organization: response.data.data.organization,
          confidence: response.data.data.confidence || 0
        };
      }

      return null;

    } catch (error) {
      console.error(`Hunter.io domain search failed for ${domain}:`, error.message);
      return null;
    }
  }

  async verifyEmail(email) {
    if (this.requestCount >= this.monthlyLimit) {
      throw new Error('Hunter.io monthly limit reached');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/email-verifier`, {
        params: {
          email: email,
          api_key: this.apiKey
        },
        timeout: 10000
      });

      this.requestCount++;

      if (response.data.data) {
        return {
          email: response.data.data.email,
          result: response.data.data.result, // deliverable, undeliverable, risky, unknown
          score: response.data.data.score || 0,
          regexp: response.data.data.regexp,
          gibberish: response.data.data.gibberish,
          disposable: response.data.data.disposable,
          webmail: response.data.data.webmail,
          mx_records: response.data.data.mx_records,
          smtp_server: response.data.data.smtp_server,
          smtp_check: response.data.data.smtp_check,
          accept_all: response.data.data.accept_all
        };
      }

      return null;

    } catch (error) {
      console.error(`Hunter.io email verification failed for ${email}:`, error.message);
      return null;
    }
  }

  getRemainingRequests() {
    return Math.max(0, this.monthlyLimit - this.requestCount);
  }
}

module.exports = HunterIOClient;
```

### Patch 5: Real Yellow Pages Scraping
**File**: `modules/scrapers/yellow-pages-scraper.js`
**Issue**: No actual Yellow Pages directory scraping
**Priority**: MEDIUM

```javascript
const axios = require('axios');
const cheerio = require('cheerio');

class YellowPagesScraper {
  constructor() {
    this.baseUrl = 'https://www.yellowpages.com';
    this.rateLimitDelay = 2000; // 2 seconds between requests
  }

  async search(query, location, maxResults = 20) {
    try {
      const searchUrl = `${this.baseUrl}/search`;
      const response = await axios.get(searchUrl, {
        params: {
          search_terms: query,
          geo_location_terms: location
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const businesses = [];

      $('.search-results .result').each((index, element) => {
        if (businesses.length >= maxResults) return false;

        const $business = $(element);
        
        const name = $business.find('.business-name').text().trim();
        const address = $business.find('.adr').text().trim();
        const phone = $business.find('.phones .phone').text().trim();
        const websiteLink = $business.find('.links .track-visit-website').attr('href');

        if (name && address) {
          businesses.push({
            name: name,
            address: address,
            phone: phone || null,
            website: websiteLink || null,
            source: 'yellow_pages',
            extractedAt: new Date().toISOString()
          });
        }
      });

      // Rate limiting - be respectful
      await this.delay(this.rateLimitDelay);

      return businesses;

    } catch (error) {
      console.error(`Yellow Pages scraping failed for "${query}" in "${location}":`, error.message);
      return [];
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = YellowPagesScraper;
```

### Patch 6: Real Data Validation
**File**: `modules/validators/data-validator.js`
**Issue**: No actual validation against real data sources
**Priority**: CRITICAL

```javascript
const axios = require('axios');
const dns = require('dns').promises;

class DataValidator {
  constructor(neverBounceClient) {
    this.neverBounceClient = neverBounceClient;
  }

  async validateBusiness(business) {
    const validation = {
      name: await this.validateBusinessName(business.name),
      address: await this.validateAddress(business.address),
      phone: await this.validatePhone(business.phone),
      website: await this.validateWebsite(business.website),
      email: await this.validateEmail(business.email)
    };

    const confidenceScore = this.calculateConfidenceScore(validation);
    const isQualified = this.determineIfQualified(validation, confidenceScore);

    return {
      isQualified,
      confidenceScore,
      validation,
      businessData: business
    };
  }

  async validateBusinessName(name) {
    if (!name || name.trim().length < 2) {
      return { isValid: false, reason: 'Name too short or empty' };
    }

    // Check for generic patterns that indicate fake data
    const genericPatterns = [
      /^Business\s+(LLC|Inc|Corporation)$/i,
      /^Company\s+\d+$/i,
      /^Generic\s+/i,
      /^Test\s+/i,
      /^Sample\s+/i
    ];

    const isGeneric = genericPatterns.some(pattern => pattern.test(name));
    
    return {
      isValid: !isGeneric,
      reason: isGeneric ? 'Generic/placeholder name detected' : 'Valid business name',
      name: name.trim()
    };
  }

  async validateAddress(address) {
    if (!address || address.trim().length < 10) {
      return { isValid: false, reason: 'Address too short or empty' };
    }

    // Check for fake address patterns
    const fakePatterns = [
      /^\d+\s+Main\s+St(reet)?[\s,]/i, // Sequential Main Street addresses
      /PO\s+Box/i,
      /Virtual\s+Office/i,
      /123\s+Fake\s+St/i
    ];

    const isFake = fakePatterns.some(pattern => pattern.test(address));

    // TODO: Add geocoding validation with Google Maps API
    // const geoValidation = await this.geocodeAddress(address);

    return {
      isValid: !isFake,
      reason: isFake ? 'Fake address pattern detected' : 'Address format valid',
      address: address.trim()
    };
  }

  async validatePhone(phone) {
    if (!phone) {
      return { isValid: false, reason: 'Phone number missing' };
    }

    // Clean phone number
    const cleanPhone = phone.replace(/[^\d]/g, '');

    // Check length
    if (cleanPhone.length !== 10) {
      return { isValid: false, reason: 'Invalid phone number length' };
    }

    // Check for fake patterns
    const fakePatterns = [
      /^555/, // 555 numbers are often fake
      /^000/, 
      /^111/,
      /^123456/,
      /^999/
    ];

    const isFake = fakePatterns.some(pattern => pattern.test(cleanPhone));

    return {
      isValid: !isFake,
      reason: isFake ? 'Fake phone number pattern detected' : 'Phone number valid',
      phone: `(${cleanPhone.slice(0,3)}) ${cleanPhone.slice(3,6)}-${cleanPhone.slice(6)}`
    };
  }

  async validateWebsite(website) {
    if (!website) {
      return { isValid: false, reason: 'Website missing' };
    }

    try {
      // Check if URL is accessible
      const response = await axios.head(website, {
        timeout: 10000,
        validateStatus: status => status < 500 // Accept redirects, but not server errors
      });

      // Check for fake domains
      const fakePatterns = [
        /example\.com$/i,
        /test\.com$/i,
        /fake\.com$/i,
        /placeholder\.com$/i
      ];

      const url = new URL(website);
      const isFakeDomain = fakePatterns.some(pattern => pattern.test(url.hostname));

      return {
        isValid: !isFakeDomain && response.status < 400,
        reason: isFakeDomain ? 'Fake domain detected' : 'Website accessible',
        website: website,
        statusCode: response.status,
        accessible: true
      };

    } catch (error) {
      return {
        isValid: false,
        reason: `Website not accessible: ${error.message}`,
        website: website,
        accessible: false
      };
    }
  }

  async validateEmail(email) {
    if (!email) {
      return { isValid: false, reason: 'Email missing' };
    }

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, reason: 'Invalid email format' };
    }

    // Check for generic patterns that indicate low quality
    const genericPatterns = ['info@', 'contact@', 'admin@', 'support@', 'sales@', 'hello@'];
    const isGeneric = genericPatterns.some(pattern => email.toLowerCase().includes(pattern));

    // Use NeverBounce for deliverability check (if available)
    let deliverabilityCheck = null;
    try {
      if (this.neverBounceClient) {
        deliverabilityCheck = await this.neverBounceClient.verifyEmail(email);
      }
    } catch (error) {
      console.log('NeverBounce verification unavailable:', error.message);
    }

    const isDeliverable = deliverabilityCheck ? 
      deliverabilityCheck.result === 'valid' : 
      true; // Assume valid if can't verify

    return {
      isValid: isDeliverable && !isGeneric,
      reason: !isDeliverable ? 'Email not deliverable' : 
              isGeneric ? 'Generic email address' : 'Email valid',
      email: email.toLowerCase(),
      isGeneric: isGeneric,
      deliverabilityCheck: deliverabilityCheck
    };
  }

  calculateConfidenceScore(validation) {
    let score = 0;
    const weights = {
      name: 20,
      address: 20, 
      phone: 25,
      website: 15,
      email: 20
    };

    Object.entries(validation).forEach(([field, result]) => {
      if (result.isValid) {
        score += weights[field] || 0;
      }
    });

    return Math.min(score, 100);
  }

  determineIfQualified(validation, confidenceScore) {
    // Require ALL critical fields to be valid
    const criticalFields = ['phone', 'website', 'email'];
    const allCriticalValid = criticalFields.every(field => validation[field].isValid);
    
    // Require minimum confidence score
    const meetsConfidenceThreshold = confidenceScore >= 80;

    return allCriticalValid && meetsConfidenceThreshold;
  }
}

module.exports = DataValidator;
```

### Patch 7: Fix Export to Only Include Real Data
**File**: `api/export.js`  
**Issue**: Exports fake/demo data instead of validated real data
**Priority**: CRITICAL

```javascript
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');

async function exportQualifiedLeads(validatedBusinesses, batchInfo) {
  // CRITICAL: Only export businesses that passed ALL validation
  const qualifiedLeads = validatedBusinesses.filter(business => 
    business.isQualified && 
    business.confidenceScore >= 80
  );

  if (qualifiedLeads.length === 0) {
    throw new Error('No qualified leads found. All businesses failed validation checks.');
  }

  // Create timestamp for unique filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `ProspectPro-Real-Leads-${timestamp}.csv`;
  const filepath = path.join(__dirname, '../exports', filename);

  // Define CSV structure with full transparency
  const csvWriter = createCsvWriter({
    path: filepath,
    header: [
      { id: 'name', title: 'Business Name' },
      { id: 'address', title: 'Full Address' },
      { id: 'phone', title: 'Phone Number' },
      { id: 'website', title: 'Website URL' },
      { id: 'email', title: 'Email Address' },
      { id: 'ownerName', title: 'Owner/Contact Name' },
      { id: 'confidenceScore', title: 'Confidence Score (%)' },
      { id: 'dataSources', title: 'Data Sources' },
      { id: 'phoneValidated', title: 'Phone Validated' },
      { id: 'websiteValidated', title: 'Website Validated' },
      { id: 'emailValidated', title: 'Email Validated' },
      { id: 'extractionDate', title: 'Extraction Date' },
      { id: 'validationNotes', title: 'Validation Notes' }
    ]
  });

  // Map validated businesses to CSV format
  const csvData = qualifiedLeads.map(business => ({
    name: business.businessData.name,
    address: business.businessData.address,
    phone: business.validation.phone.phone || business.businessData.phone,
    website: business.validation.website.website || business.businessData.website,
    email: business.validation.email.email || business.businessData.email,
    ownerName: business.businessData.ownerName || 'Not Found',
    confidenceScore: business.confidenceScore,
    dataSources: business.businessData.sources?.join(', ') || business.businessData.source,
    phoneValidated: business.validation.phone.isValid ? 'Yes' : 'No',
    websiteValidated: business.validation.website.isValid ? 'Yes' : 'No', 
    emailValidated: business.validation.email.isValid ? 'Yes' : 'No',
    extractionDate: new Date().toISOString(),
    validationNotes: generateValidationNotes(business.validation)
  }));

  // Write CSV file
  await csvWriter.writeRecords(csvData);

  // Generate summary report
  const summary = generateExportSummary(qualifiedLeads, validatedBusinesses, batchInfo);

  return {
    filename: filename,
    filepath: filepath,
    leadCount: qualifiedLeads.length,
    summary: summary,
    csvData: csvData
  };
}

function generateValidationNotes(validation) {
  const notes = [];
  
  Object.entries(validation).forEach(([field, result]) => {
    if (!result.isValid) {
      notes.push(`${field}: ${result.reason}`);
    }
  });

  return notes.length > 0 ? notes.join('; ') : 'All validations passed';
}

function generateExportSummary(qualifiedLeads, allBusinesses, batchInfo) {
  const totalProcessed = allBusinesses.length;
  const qualificationRate = Math.round((qualifiedLeads.length / totalProcessed) * 100);
  
  const validationStats = {
    totalProcessed: totalProcessed,
    qualifiedLeads: qualifiedLeads.length,
    qualificationRate: `${qualificationRate}%`,
    averageConfidenceScore: Math.round(
      qualifiedLeads.reduce((sum, lead) => sum + lead.confidenceScore, 0) / qualifiedLeads.length
    ),
    apiCallsMade: batchInfo.apiCallsMade || 0,
    totalCost: `$${(batchInfo.totalCost || 0).toFixed(3)}`,
    costPerQualifiedLead: qualifiedLeads.length > 0 ? 
      `$${((batchInfo.totalCost || 0) / qualifiedLeads.length).toFixed(3)}` : 'N/A',
    extractionDate: new Date().toISOString(),
    batchTemplate: batchInfo.template || 'unknown'
  };

  return validationStats;
}

module.exports = {
  exportQualifiedLeads,
  generateExportSummary
};
```

## 🧪 Testing Patches

### Test File: `test/test-real-data.js`
**Purpose**: Verify no fake data is generated

```javascript
const assert = require('assert');
const BusinessDiscovery = require('../api/business-discovery');

async function testNoFakeData() {
  console.log('🧪 Testing for fake data elimination...');
  
  const discovery = new BusinessDiscovery();
  const results = await discovery.discoverRealBusinesses('restaurants', 'Austin, TX', 5);
  
  // Check for common fake business names
  const fakeNames = ['Artisan Bistro', 'Downtown Café', 'Gourmet Restaurant'];
  const foundFakeNames = results.filter(business => 
    fakeNames.includes(business.name)
  );
  
  assert(foundFakeNames.length === 0, 
    `Found fake business names: ${foundFakeNames.map(b => b.name).join(', ')}`);
  
  // Check for sequential Main Street addresses
  const mainStreetPattern = /\d+\s+Main\s+St/;
  const fakeAddresses = results.filter(business => 
    mainStreetPattern.test(business.address)
  );
  
  assert(fakeAddresses.length === 0,
    `Found fake addresses: ${fakeAddresses.map(b => b.address).join(', ')}`);
  
  console.log('✅ No fake data detected');
}

testNoFakeData().catch(console.error);
```

## 🚨 Critical Success Criteria

1. **Zero Fake Data**: No hardcoded business names or addresses
2. **Real API Calls**: All data comes from actual API responses  
3. **Complete Validation**: Every exported lead verified through multiple sources
4. **Working URLs**: All website links return valid HTTP responses
5. **Deliverable Emails**: All emails pass deliverability checks
6. **Cost Accuracy**: Costs reflect actual API usage, not estimates

## 📝 Implementation Checklist

- [ ] Replace fake business generation with Google Places API calls
- [ ] Implement real website scraping with Scrapingdog  
- [ ] Add Hunter.io email discovery and verification
- [ ] Build Yellow Pages scraper for supplemental data
- [ ] Create comprehensive data validation pipeline
- [ ] Fix export to only include validated real data
- [ ] Add testing to verify no fake data generation
- [ ] Update UI to show real validation status and sources

Each patch should be implemented and tested individually before moving to the next one.