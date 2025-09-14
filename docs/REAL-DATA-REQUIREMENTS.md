# Real Data Requirements for ProspectPro

## 🎯 Data Validation Standards

### Business Contact Requirements
Every exported lead MUST have ALL of the following verified data points:

#### 1. Business Name
- **Requirement**: Real, specific business name (not generic)
- **Validation**: Must not match patterns like "Business LLC", "Company Inc", "Generic Name"
- **Source**: Google Places API, Yellow Pages, or Yelp
- **Quality Check**: Cross-reference against multiple sources

#### 2. Business Address  
- **Requirement**: Real street address (not PO Box or virtual office)
- **Validation**: Must not follow sequential patterns (100 Main St, 110 Main St, etc.)
- **Source**: Google Places API with geocoding verification
- **Quality Check**: Address must be verifiable through Google Maps

#### 3. Phone Number
- **Requirement**: Working business phone number
- **Validation**: Must not match fake patterns (555-xxxx, 000-xxx, 111-xxx)
- **Format**: (XXX) XXX-XXXX standard US format
- **Quality Check**: Must be 10 digits when cleaned

#### 4. Website URL
- **Requirement**: Accessible, working website
- **Validation**: Must return HTTP 200-399 status code
- **Quality Check**: Cannot be example.com, test.com, or other placeholder domains
- **Verification**: HEAD request to confirm accessibility

#### 5. Email Address
- **Requirement**: Deliverable email address, preferably non-generic
- **Validation**: Must pass deliverability check via NeverBounce or similar
- **Quality Preference**: Owner/personal emails over generic (info@, contact@)
- **Format**: Valid RFC 5322 email format

## 🔍 Data Source Requirements

### Primary Sources (Required)
1. **Google Places API**
   - Text Search for business discovery
   - Place Details for contact information
   - Must handle rate limits and errors gracefully

2. **Website Scraping (Scrapingdog)**
   - Extract contact information from business websites
   - Parse multiple page sections (contact, about, team, footer)
   - Handle different website structures and formats

### Secondary Sources (Supplemental)
1. **Yellow Pages Scraping**
   - Public directory information
   - Backup for businesses not in Google Places
   - Respectful rate limiting (2-3 seconds between requests)

2. **Hunter.io Email Discovery**
   - Domain-based email discovery
   - Email pattern identification
   - Deliverability scoring

3. **NeverBounce Email Validation**
   - Email deliverability verification
   - Bounce rate prediction
   - Spam trap detection

## ⚠️ Zero Tolerance Policies

### Absolutely Prohibited Data
1. **Hardcoded/Generated Business Names**
   - ❌ "Artisan Bistro", "Downtown Café", "Gourmet Restaurant"
   - ❌ Any business name not returned by real API

2. **Sequential/Pattern Addresses**
   - ❌ "100 Main St", "110 Main St", "120 Main St"
   - ❌ Any address following obvious sequential patterns

3. **Fake Phone Numbers**
   - ❌ (512) 555-xxxx patterns
   - ❌ (000) xxx-xxxx patterns
   - ❌ Any phone number not from business listings

4. **Non-Working Websites**
   - ❌ URLs that return 404, 500, or timeout errors
   - ❌ Placeholder domains (example.com, test.com)
   - ❌ URLs that don't resolve to real websites

5. **Undeliverable Emails**
   - ❌ Emails that fail deliverability checks
   - ❌ Emails from domains that don't exist
   - ❌ Emails with invalid format or syntax

## 📊 Quality Scoring System

### Confidence Score Calculation (0-100%)
- **Business Name Verification**: 20 points
- **Address Verification**: 20 points  
- **Phone Number Verification**: 25 points
- **Website Verification**: 15 points
- **Email Verification**: 20 points

### Minimum Thresholds
- **Export Threshold**: 80% confidence score minimum
- **All Critical Fields**: Phone, Website, Email must be 100% verified
- **Multi-Source Verification**: Data from at least 2 different sources

## 🧪 Testing Requirements

### Pre-Deployment Testing
1. **No Fake Data Test**
   - Run extraction on known query (e.g., "restaurants Austin TX")
   - Verify zero fake business names appear
   - Confirm all addresses are real, verifiable locations

2. **Website Accessibility Test**
   - Check every exported website URL
   - Confirm all return successful HTTP responses
   - Verify websites contain relevant business information

3. **Email Deliverability Test**
   - Sample 10% of exported emails
   - Run through email verification service
   - Confirm <5% bounce rate on sample

4. **Cost Accuracy Test**
   - Track actual API costs during test run
   - Compare to displayed cost estimates
   - Verify cost per lead calculations are accurate

### Validation Checks Per Business
```javascript
const validationChecks = {
  businessName: {
    notEmpty: true,
    notGeneric: true,
    fromRealSource: true
  },
  address: {
    notEmpty: true,
    notPOBox: true,
    notSequential: true,
    geocodeable: true
  },
  phone: {
    notEmpty: true,
    validFormat: true,
    notFakePattern: true,
    tenDigits: true
  },
  website: {
    notEmpty: true,
    validURL: true,
    accessible: true,
    notPlaceholder: true
  },
  email: {
    notEmpty: true,
    validFormat: true,
    deliverable: true,
    preferNonGeneric: true
  }
};
```

## 🔄 Data Pipeline Flow

### Stage 1: Discovery (Free)
1. Query Google Places API for business listings
2. Scrape Yellow Pages for supplemental data
3. Merge and deduplicate business listings
4. Pre-validate business quality (name, address patterns)
5. Only proceed with businesses scoring >70%

### Stage 2: Enrichment (Paid APIs)
1. Get detailed information from Google Places Details API
2. Scrape business websites for contact information
3. Generate email candidates using permutation patterns
4. Discover emails using Hunter.io domain search
5. Extract owner names and additional contact info

### Stage 3: Validation (Verification)
1. Validate phone numbers (format, pattern checks)
2. Verify website accessibility (HEAD requests)
3. Validate email deliverability (NeverBounce)
4. Calculate confidence scores for each business
5. Apply minimum thresholds for export qualification

### Stage 4: Export (Quality Assurance)
1. Filter businesses meeting all quality requirements
2. Include source attribution for transparency
3. Add confidence scores and validation details
4. Export only verified, complete business data
5. Provide summary with actual costs and success rates

## 📈 Success Metrics

### Data Quality KPIs
- **Accuracy Rate**: >95% of exported data verified as accurate
- **Completeness Rate**: 100% of exported leads have all required fields
- **Deliverability Rate**: <5% email bounce rate on exported addresses
- **Website Accessibility**: 100% of exported websites return successful responses

### Cost Optimization KPIs  
- **Cost per Qualified Lead**: <$0.50 target
- **API Efficiency**: >40% qualification rate from API calls
- **Pre-validation Savings**: >60% reduction in unnecessary API calls
- **Overall Cost Reduction**: >65% vs traditional methods

### Business Impact KPIs
- **Client Satisfaction**: <5% complaint rate on data quality
- **Campaign Performance**: >20% improvement in client response rates
- **Data Verification Time**: <10 minutes for client to verify sample
- **Repeat Usage**: >80% of clients run multiple campaigns

## 🚨 Error Handling Requirements

### API Failure Handling
- **Google Places API Down**: Fall back to Yellow Pages + Yelp scraping
- **Scrapingdog API Down**: Use alternative scraping methods or skip website data
- **Hunter.io API Down**: Use email permutation without verification
- **NeverBounce API Down**: Use basic email format validation

### Data Quality Failures
- **No Qualified Leads Found**: Return clear error message, never fake data
- **Low Confidence Scores**: Provide recommendations for parameter adjustment  
- **API Rate Limits Exceeded**: Implement proper queuing and retry logic
- **Validation Failures**: Log specific reasons for each validation failure

### User Experience During Failures
- **Transparent Error Messages**: Show actual API errors, not generic messages
- **Alternative Suggestions**: Recommend parameter changes for better results
- **Partial Results**: Allow export of partial batches if some leads qualify
- **Cost Refunds**: Don't charge for API calls that return unusable data

This document serves as the definitive specification for data quality standards in ProspectPro. All implementation must strictly adhere to these requirements.