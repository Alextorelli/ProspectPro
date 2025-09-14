# Hunter.io Integration - Immediate Implementation Guide

## Overview
Hunter.io provides email discovery and verification APIs that can significantly enhance ProspectPro's contact data quality. Current pricing starts at $49/month for 500 searches + 1000 verifications.

## Cost Analysis & Optimization

### Pricing Tiers (2025):
- **Free Plan**: 25 searches/month + 50 verifications (testing only)
- **Starter Plan**: $49/month (500 searches + 1,000 verifications) 
- **Growth Plan**: $99/month (2,500 searches + 5,000 verifications)
- **Pro Plan**: $199/month (10,000 searches + 20,000 verifications)

### Cost Per Lead:
- Starter: $0.098 per search attempt (35-45% success rate = $0.22-$0.28 per found email)
- Growth: $0.0396 per search attempt ($0.088-$0.113 per found email)
- Pro: $0.0199 per search attempt ($0.044-$0.057 per found email)

## Immediate Implementation (Week 1-2)

### Phase 1: Basic Email Discovery Integration

#### API Endpoints to Implement:
```javascript
// 1. Domain Search - Find emails from company domain
GET https://api.hunter.io/v2/domain-search?domain=company.com&api_key=YOUR_KEY

// 2. Email Finder - Find specific person's email
GET https://api.hunter.io/v2/email-finder?domain=company.com&first_name=John&last_name=Doe&api_key=YOUR_KEY

// 3. Email Verifier - Verify email deliverability  
GET https://api.hunter.io/v2/email-verifier?email=test@company.com&api_key=YOUR_KEY
```

#### Integration Points in ProspectPro:
1. **Stage 2 (Enrichment)**: Add email discovery after website scraping
2. **Stage 3 (Validation)**: Verify discovered emails before export
3. **Cost Control**: Pre-validate domains to avoid wasting credits

#### Cost Optimization Strategies:
```javascript
// Smart credit usage - only search high-confidence leads
const shouldSearchEmails = (businessData) => {
  return businessData.confidence >= 70 && 
         businessData.website && 
         businessData.website.includes('http') &&
         !businessData.website.includes('facebook.com');
};

// Batch processing to minimize API calls
const emailBatch = businesses
  .filter(shouldSearchEmails)
  .slice(0, 100); // Process in batches of 100
```

### Phase 2: Email Pattern Generation (Cost-Free Enhancement)

#### Implementation:
```javascript
// Generate common email patterns before using Hunter.io
const generateEmailPatterns = (firstName, lastName, domain) => {
  const patterns = [
    `${firstName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()[0]}${lastName.toLowerCase()}@${domain}`,
    `info@${domain}`,
    `contact@${domain}`,
    `sales@${domain}`
  ];
  return patterns;
};

// Only use Hunter.io if patterns fail validation
```

### Expected Results:
- **60-80% improvement** in email discovery rates
- **Cost per qualified lead**: $0.05-0.15 additional
- **Email deliverability**: 70-85% (with verification)

## Cost Management Implementation

### Smart Usage Controls:
```javascript
// Track daily/monthly spend
const MONTHLY_BUDGET = 500; // $500 limit
const DAILY_LIMIT = Math.floor(MONTHLY_BUDGET / 30);

// Credit tracking
let dailySpend = 0;
const trackHunterUsage = (searches, verifications) => {
  const cost = (searches * 0.098) + (verifications * 0.049);
  dailySpend += cost;
  
  if (dailySpend > DAILY_LIMIT) {
    throw new Error('Daily Hunter.io budget exceeded');
  }
};
```

### ROI Monitoring:
- Track conversion rates: discovered emails → qualified leads → customers
- A/B test: Hunter.io emails vs. pattern-generated emails
- Break-even: If 1 customer = $100, need <1% conversion rate to justify costs

## Technical Integration Steps

### 1. API Client Setup:
```javascript
class HunterIOClient {
  constructor(apiKey, monthlyBudget = 500) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.hunter.io/v2';
    this.budget = monthlyBudget;
    this.usageTracking = new Map();
  }

  async searchDomain(domain, limit = 10) {
    // Check budget first
    if (this.checkBudget('search')) {
      const response = await fetch(
        `${this.baseURL}/domain-search?domain=${domain}&limit=${limit}&api_key=${this.apiKey}`
      );
      return await response.json();
    }
    throw new Error('Budget exceeded');
  }

  async findEmail(domain, firstName, lastName) {
    if (this.checkBudget('finder')) {
      const response = await fetch(
        `${this.baseURL}/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${this.apiKey}`
      );
      return await response.json();
    }
    throw new Error('Budget exceeded');
  }

  async verifyEmail(email) {
    if (this.checkBudget('verify')) {
      const response = await fetch(
        `${this.baseURL}/email-verifier?email=${email}&api_key=${this.apiKey}`
      );
      return await response.json();
    }
    throw new Error('Budget exceeded');
  }
}
```

### 2. Integration with Existing Pipeline:
```javascript
// Enhanced enrichment with Hunter.io
const enrichBusinessWithEmails = async (businessData) => {
  const hunterClient = new HunterIOClient(process.env.HUNTER_IO_API_KEY);
  
  try {
    // Step 1: Try domain search for any emails
    const domainEmails = await hunterClient.searchDomain(businessData.domain);
    
    // Step 2: If owner name available, try targeted search
    if (businessData.owner_name) {
      const [firstName, lastName] = businessData.owner_name.split(' ');
      const targetedEmail = await hunterClient.findEmail(
        businessData.domain, 
        firstName, 
        lastName
      );
      domainEmails.emails.push(targetedEmail);
    }
    
    // Step 3: Verify all discovered emails
    const verifiedEmails = await Promise.all(
      domainEmails.emails.map(email => hunterClient.verifyEmail(email.value))
    );
    
    // Step 4: Add to business data
    businessData.emails = verifiedEmails
      .filter(result => result.result === 'deliverable')
      .map(result => result.email);
      
    businessData.email_confidence = verifiedEmails.length > 0 ? 
      Math.max(...verifiedEmails.map(r => r.score)) : 0;
    
  } catch (error) {
    console.error('Hunter.io integration error:', error);
    // Graceful fallback to existing email discovery
  }
  
  return businessData;
};
```

### 3. Environment Variables:
```bash
# Add to .env
HUNTER_IO_API_KEY=your_hunter_api_key_here
HUNTER_MONTHLY_BUDGET=500
HUNTER_ENABLE=true

# Rate limiting
HUNTER_DAILY_LIMIT=50
HUNTER_BATCH_SIZE=10
```

## Success Metrics

### Track These KPIs:
1. **Email Discovery Rate**: % of businesses with emails found
2. **Email Verification Rate**: % of emails marked as deliverable
3. **Cost Per Email**: Total spend ÷ verified emails discovered
4. **Lead Quality**: Conversion rate of Hunter.io emails vs. other sources
5. **Budget Utilization**: Monthly spend vs. budget limit

### Optimization Targets:
- **Email discovery rate**: 60%+ (from current ~30%)
- **Verification rate**: 80%+ deliverable emails
- **Cost per qualified email**: <$0.20
- **ROI**: Break-even at 1% email → customer conversion

## Next Steps

1. **Week 1**: Implement basic API client with budget controls
2. **Week 2**: Integrate domain search into enrichment pipeline  
3. **Week 3**: Add targeted email finder for known owner names
4. **Week 4**: Implement verification and quality scoring

## Risk Mitigation

### Budget Overruns:
- Hard daily/monthly limits in code
- Real-time spend tracking
- Automatic fallback to free methods

### API Reliability:
- Graceful error handling
- Fallback to pattern generation
- Retry logic with exponential backoff

### Quality Control:
- Verification before using emails
- A/B testing against existing methods
- Regular accuracy audits