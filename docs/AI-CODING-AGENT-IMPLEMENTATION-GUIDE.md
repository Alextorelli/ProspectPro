# 🤖 AI Coding Agent Implementation Guide for ProspectPro Real API

## 📋 Project Overview

Transform ProspectPro from fake data generation to **real API integration** using Google Places, website scraping, and email validation services. This guide provides step-by-step instructions for AI coding agents (GitHub Copilot, Claude, ChatGPT, etc.).

---

## 🎯 Primary Objective

**ELIMINATE ALL FAKE DATA** and replace with verified business contacts from real API sources.

### Current Problems to Fix:
- ❌ Generates fake businesses: "Artisan Bistro", "Downtown Café", "Gourmet Restaurant"
- ❌ Creates sequential addresses: "100 Main St", "110 Main St", "120 Main St"
- ❌ Uses non-working websites: artisanbistro.com, downtowncaf.net
- ❌ Provides fake contact information that fails validation

### Target Solution:
- ✅ Only real businesses from Google Places API
- ✅ Only verified addresses that exist on Google Maps  
- ✅ Only working websites that return HTTP 200 responses
- ✅ Only deliverable emails verified through NeverBounce

---

## 🚀 Implementation Steps

### Step 1: Environment Setup
```bash
# 1. Extract the ProspectPro-Real-API-Package.zip
# 2. Navigate to project directory
cd ProspectPro-Real-API-Package

# 3. Install dependencies
npm install

# 4. Set up environment variables
cp .env.example .env
# Edit .env with real API keys (see API Keys section below)

# 5. Start development server
npm run dev
```

### Step 2: API Keys Configuration

#### Required API Keys:
1. **Google Places API** - https://console.cloud.google.com/apis/credentials
   - Enable: Places API, Places Details API
   - Cost: ~$0.032 per search, $0.017 per details
   - Add to `.env`: `GOOGLE_PLACES_API_KEY=your_key_here`

2. **Scrapingdog API** - https://www.scrapingdog.com/  
   - Free tier: 1000 requests/month
   - Cost: ~$0.002 per website scrape
   - Add to `.env`: `SCRAPINGDOG_API_KEY=your_key_here`

3. **Hunter.io API** - https://hunter.io/
   - Free tier: 25 searches/month
   - For email discovery and verification
   - Add to `.env`: `HUNTER_IO_API_KEY=your_key_here`

4. **NeverBounce API** - https://neverbounce.com/
   - Free tier: 1000 verifications/month  
   - For email deliverability validation
   - Add to `.env`: `NEVERBOUNCE_API_KEY=your_key_here`

### Step 3: Core Implementation Tasks

#### Task 3.1: Fix Business Discovery Logic
**File**: `api/business-discovery.js`
**Priority**: CRITICAL

**Current Issue**: No real API integration
**Required Fix**: Implement actual Google Places API calls

```javascript
// CURRENT PROBLEM - REMOVE THIS:
// No real API calls are being made

// IMPLEMENT THIS SOLUTION:
router.post('/discover', async (req, res) => {
    const { query, location, count } = req.body;
    
    try {
        // Real Google Places Text Search
        const googleResults = await googlePlacesClient.textSearch({
            query: `${query} in ${location}`,
            type: 'establishment'
        });
        
        // Real Yellow Pages Scraping
        const yellowPagesResults = await yellowPagesScraper.search(query, location);
        
        // Merge and validate results
        const businesses = mergeAndValidate(googleResults, yellowPagesResults);
        
        res.json({ success: true, businesses });
        
    } catch (error) {
        // NEVER return fake data on error
        res.status(500).json({ 
            error: 'Real API calls failed', 
            message: error.message 
        });
    }
});
```

#### Task 3.2: Implement Google Places Client
**File**: `modules/api-clients/google-places.js`
**Priority**: CRITICAL

**Implementation Requirements**:
- Text Search API for business discovery
- Place Details API for contact information
- Error handling for API failures
- Cost tracking for transparency

```javascript
class GooglePlacesClient {
    async textSearch(params) {
        const response = await axios.get(`${this.baseUrl}/textsearch/json`, {
            params: {
                query: params.query,
                key: this.apiKey,
                type: 'establishment'
            }
        });
        
        if (response.data.status !== 'OK') {
            throw new Error(`Google Places API error: ${response.data.status}`);
        }
        
        return response.data.results.map(place => ({
            name: place.name,
            address: place.formatted_address,
            placeId: place.place_id,
            source: 'google_places'
        }));
    }
}
```

#### Task 3.3: Build Website Scraper
**File**: `modules/api-clients/scrapingdog.js`
**Priority**: HIGH

**Implementation Requirements**:
- Scrape business websites for contact information
- Extract emails, phone numbers, owner names
- Handle different website structures
- Validate extracted data quality

```javascript
class ScrapingdogClient {
    async scrapeWebsite(url) {
        const response = await axios.get(this.baseUrl, {
            params: {
                api_key: this.apiKey,
                url: url
            }
        });
        
        const $ = cheerio.load(response.data);
        
        return {
            emails: this.extractEmails($),
            phones: this.extractPhones($),
            socialLinks: this.extractSocialLinks($)
        };
    }
}
```

#### Task 3.4: Implement Email Discovery
**File**: `modules/api-clients/hunter-io.js`
**Priority**: HIGH

**Implementation Requirements**:
- Domain-based email discovery
- Email verification for deliverability
- Rate limiting for free tier (25/month)
- Pattern-based email generation

#### Task 3.5: Add Data Validation
**File**: `modules/validators/data-validator.js`
**Priority**: CRITICAL

**Implementation Requirements**:
- Validate phone numbers (no 555-xxxx patterns)
- Verify website accessibility (HTTP 200 responses)
- Check email deliverability (NeverBounce integration)
- Calculate confidence scores (0-100%)

```javascript
class DataValidator {
    async validateBusiness(business) {
        const validation = {
            phone: await this.validatePhone(business.phone),
            website: await this.validateWebsite(business.website),
            email: await this.validateEmail(business.email)
        };
        
        const confidenceScore = this.calculateConfidenceScore(validation);
        const isQualified = this.determineIfQualified(validation);
        
        return { isQualified, confidenceScore, validation };
    }
}
```

### Step 4: Frontend Integration

#### Task 4.1: Update Client-Side API Calls
**File**: `public/app.js`
**Priority**: MEDIUM

**Current Issue**: Frontend may still show fake data
**Required Fix**: Ensure frontend only displays real API results

```javascript
async startRealDataExtraction() {
    const response = await fetch('/api/business/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: this.selectedIndustry,
            location: this.selectedLocation,
            count: this.selectedTemplate.targetLeads
        })
    });
    
    const result = await response.json();
    
    if (result.success) {
        this.displayRealResults(result.businesses);
    } else {
        this.displayError('No real data available - API calls failed');
    }
}
```

### Step 5: Testing & Validation

#### Task 5.1: Create API Test Suite
**File**: `test/test-real-apis.js`
**Priority**: HIGH

```javascript
// Test that no fake data is generated
async function testNoFakeData() {
    const results = await businessDiscovery.discover('restaurants', 'Austin, TX', 5);
    
    // Check for fake business names
    const fakeNames = ['Artisan Bistro', 'Downtown Café', 'Gourmet Restaurant'];
    const hasFakeNames = results.some(r => fakeNames.includes(r.name));
    
    assert(!hasFakeNames, 'Found fake business names in results');
    
    // Check for sequential addresses
    const hasSequentialAddresses = results.some(r => 
        /\d+ Main St/.test(r.address) && /\d{3} Main St/.test(r.address)
    );
    
    assert(!hasSequentialAddresses, 'Found fake sequential addresses');
}
```

#### Task 5.2: Website Accessibility Test
**File**: `test/test-website-validation.js`
**Priority**: HIGH

```javascript
// Test that all exported websites work
async function testWebsiteAccessibility() {
    const results = await businessDiscovery.discover('restaurants', 'Austin, TX', 3);
    
    for (const business of results) {
        if (business.website) {
            const response = await fetch(business.website, { method: 'HEAD' });
            assert(response.ok, `Website ${business.website} is not accessible`);
        }
    }
}
```

### Step 6: Error Handling & Edge Cases

#### Task 6.1: API Failure Handling
**Priority**: HIGH

**Implementation Requirements**:
- Never fallback to fake data when APIs fail
- Provide clear error messages to users
- Implement graceful degradation
- Log actual API errors for debugging

```javascript
// CORRECT error handling
if (googlePlacesResponse.error) {
    throw new Error(`Google Places API failed: ${googlePlacesResponse.error}`);
    // NEVER: return fakeBusinessData();
}

// CORRECT user messaging
if (businesses.length === 0) {
    return { 
        success: false, 
        message: 'No businesses found in this location. Try different search terms.',
        businesses: [] // Empty array, not fake data
    };
}
```

#### Task 6.2: Rate Limit Management
**Priority**: MEDIUM

**Implementation Requirements**:
- Track API usage against free tier limits
- Implement exponential backoff for retries
- Queue requests to avoid rate limiting
- Show users when limits are reached

---

## 🧪 Validation Checklist

### Before Deployment:
- [ ] No hardcoded business names in code
- [ ] All website URLs return HTTP 200 responses
- [ ] No sequential address patterns (100 Main St, 110 Main St)
- [ ] All phone numbers follow real patterns (not 555-xxxx)
- [ ] All emails pass basic deliverability checks
- [ ] Error handling never returns fake data
- [ ] API costs are accurately calculated and displayed
- [ ] Export only includes verified, complete business data

### Testing Commands:
```bash
# Test API integrations
npm test

# Test specific modules
node test/test-google-places.js
node test/test-no-fake-data.js
node test/test-website-validation.js

# Check API health
curl http://localhost:3000/health
```

---

## 🚨 Critical Success Criteria

1. **Zero Fake Data**: No business names, addresses, or contacts that don't exist in real APIs
2. **Working URLs**: Every exported website must return successful HTTP response  
3. **Deliverable Emails**: Every exported email must pass deliverability validation
4. **Real Phone Numbers**: Every exported phone must follow valid patterns and not use fake prefixes
5. **Cost Accuracy**: Displayed costs must match actual API usage
6. **Error Transparency**: Show real API errors, never generic messages
7. **Source Attribution**: Every piece of data must be traceable to its API source

---

## 🔧 Debugging Guide

### Common Issues:

1. **"Artisan Bistro" still appearing in results**
   - Check: `api/business-discovery.js` for hardcoded arrays
   - Fix: Remove all fake data generation logic

2. **Websites returning 404 errors**
   - Check: Website validation in `modules/validators/data-validator.js`
   - Fix: Add HTTP accessibility testing before export

3. **Sequential addresses (100 Main St, 110 Main St)**
   - Check: Address generation logic in business discovery
   - Fix: Only use addresses returned by Google Places API

4. **High cost per lead**
   - Check: Pre-validation scoring in `modules/validators/pre-validation.js`
   - Fix: Improve filtering to reduce unnecessary API calls

### Debug Commands:
```bash
# Check what data is actually being generated
node debug/inspect-business-data.js "restaurants" "Austin, TX"

# Validate specific business
node debug/validate-business.js "business-name"

# Test API connections
node debug/test-api-connections.js
```

---

## 📚 Additional Resources

- **Google Places API Documentation**: https://developers.google.com/maps/documentation/places/web-service
- **Scrapingdog API Documentation**: https://scrapingdog.com/documentation  
- **Hunter.io API Documentation**: https://hunter.io/api-documentation
- **NeverBounce API Documentation**: https://developers.neverbounce.com/

This implementation guide ensures that AI coding agents have clear, actionable steps to transform ProspectPro into a real API-powered lead generation platform with zero tolerance for fake data.