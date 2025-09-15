# ProspectPro - Real API Lead Generation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Zero Fake Data](https://img.shields.io/badge/Zero%20Fake%20Data-Guaranteed-brightgreen.svg)]()

## 🎯 Mission: Zero Tolerance for Fake Business Data

ProspectPro is a cost-optimized lead generation platform that integrates with **real APIs only** - Google Places, website scraping, and email verification services. Every business contact is verified through multiple sources before export.

### ❌ What We Eliminated
- Fake business names like "Artisan Bistro", "Downtown Café"
- Sequential addresses like "100 Main St", "110 Main St" 
- Non-working websites and undeliverable emails
- Generic contact information that wastes your time

### ✅ What You Get Instead
- **Real businesses** from Google Places API
- **Working websites** verified with HTTP 200 responses
- **Deliverable emails** validated through NeverBounce
- **Complete contact data** with confidence scores

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- API keys for Google Places, Scrapingdog, Hunter.io, NeverBounce

### Installation
```bash
git clone https://github.com/appsmithery/prospect-pro-real-api.git
cd prospect-pro-real-api
npm install
npm run setup  # Creates .env file
```

### Configuration
Edit `.env` with your API keys:
```bash
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
SCRAPINGDOG_API_KEY=your_scrapingdog_api_key_here
HUNTER_IO_API_KEY=your_hunter_io_api_key_here
NEVERBOUNCE_API_KEY=your_neverbounce_api_key_here
```

### Development
```bash
npm run dev     # Start development server
npm run test    # Validate zero fake data
npm run validate # Run all tests
```

### Real-Time Monitoring
```bash
npm start       # Start production server
# Open browser to: http://localhost:3000/monitoring
```

Monitor your lead generation campaigns with:
- **Live cost tracking** with budget alerts
- **API status monitoring** across all services
- **Real-time activity feeds** for campaigns
- **Performance metrics** and success rates

## 🏗️ Architecture

### 4-Stage Data Pipeline

1. **Discovery** (Free)
   - Google Places API text search
   - Yellow Pages directory scraping
   - Pre-validation scoring (70%+ threshold)

2. **Enrichment** (Paid APIs)
   - Website content scraping
   - Email discovery patterns
   - Contact name extraction

3. **Validation** (Verification)
   - Website accessibility testing
   - Email deliverability verification
   - Confidence scoring (0-100%)

4. **Export** (Quality Assurance)
   - Only 80%+ confidence leads exported
   - Full source attribution included
   - Cost transparency provided

### Directory Structure
```
├── api/                    # API endpoints
│   ├── business-discovery.js  # Core discovery logic
│   └── export.js             # Lead export functionality
├── modules/
│   ├── api-clients/          # External API integrations
│   │   ├── google-places.js
│   │   ├── scrapingdog.js
│   │   ├── hunter-io.js
│   │   └── neverbounce.js
│   ├── validators/           # Data validation
│   │   ├── data-validator.js
│   │   └── pre-validation.js
│   └── scrapers/            # Web scraping
│       └── yellow-pages-scraper.js
├── test/                   # Validation tests
│   ├── test-real-data.js
│   └── test-website-validation.js
└── public/                 # Frontend interface
```

## 📊 Quality Standards

### Data Requirements (100% Validated)
- **Business Name**: Real, specific (not "Business LLC")
- **Address**: Geocodeable, not sequential patterns
- **Phone**: Valid format, not 555-xxxx fake numbers
- **Website**: Returns HTTP 200-399 status codes
- **Email**: Passes deliverability verification (80%+ confidence)

### Success Metrics
- **Data Accuracy**: >95% of exported leads verified
- **Website Accessibility**: 100% success rate required
- **Email Deliverability**: <5% bounce rate target
- **Cost Efficiency**: <$0.50 per qualified lead

## 💰 API Cost Management

### Estimated Costs
- **Google Places**: ~$0.032 per search, $0.017 per details
- **Scrapingdog**: ~$0.002 per website scrape
- **Hunter.io**: Free tier 25 searches/month
- **NeverBounce**: Free tier 1000 verifications/month

### Cost Optimization
- Pre-validation scoring reduces API waste by 60%+
- Only businesses scoring 70%+ proceed to expensive APIs
- Real-time cost tracking and transparent reporting

## 🧪 Testing & Validation

### Zero Fake Data Validation
```bash
npm run test        # Detect any fake data patterns
npm run test:websites # Verify all URLs are accessible
npm run validate    # Complete validation suite
```

### Continuous Integration
All code changes are automatically tested for:
- Hardcoded fake business data
- Non-working website URLs
- Sequential address patterns
- Invalid phone/email formats

## 🔧 API Integration

### Google Places Client
```javascript
const results = await googlePlacesClient.textSearch({
  query: `restaurants in Austin, TX`,
  type: 'establishment'
});
```

### Website Scraping
```javascript
const contactInfo = await scrapingdogClient.scrapeWebsite(businessUrl);
// Returns: emails, phones, contact names, social links
```

### Email Verification
```javascript
const verification = await neverBounceClient.verifyEmail(email);
// Returns: deliverable/undeliverable + confidence score
```

## 📈 Export Format

### CSV Output
Every exported lead includes:
- Complete business contact information
- Confidence score (0-100%)
- Source attribution (Google Places, Website, etc.)
- Validation status for each field
- Cost breakdown per lead

### Sample Export
```csv
Business Name,Address,Phone,Website,Email,Confidence Score,Sources
"Franklin Barbecue","900 E 11th St, Austin, TX","(512) 653-1187","https://franklinbbq.com","info@franklinbbq.com","94%","Google Places, Website"
```

## 🚨 Error Handling

### Never Fallback to Fake Data
```javascript
// ✅ CORRECT
if (apiCall.failed) {
  throw new Error('Real API failed');
}

// ❌ NEVER DO THIS
if (apiCall.failed) {
  return generateFakeData(); 
}
```

### Transparent Error Messages
- Show actual API errors to users
- Provide specific recommendations for parameter adjustments
- Never hide failures behind generic messages

## 📚 Documentation

- [Monitoring Dashboard](docs/MONITORING_DASHBOARD.md) - Real-time monitoring interface
- [Real Data Requirements](docs/REAL-DATA-REQUIREMENTS.md)
- [API Integration Guide](docs/API-INTEGRATION-PATCHES.md)
- [AI Agent Instructions](.github/copilot-instructions.md)
- [Development Workflow](docs/DEVELOPMENT.md)

## 🤝 Contributing

1. **Zero Fake Data Policy**: All PRs must pass fake data detection tests
2. **API Integration**: Only real API endpoints accepted
3. **Quality Standards**: 80%+ confidence threshold for all leads
4. **Testing Required**: New features must include validation tests

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🎯 Quality Guarantee

**Every exported lead is validated through multiple real API sources.**  
**Zero fake data. Zero wasted time. Real business contacts only.**

---

### 🚀 Ready to Generate Real Leads?

```bash
npm install
npm run setup
npm run dev
```

Transform your lead generation with verified business contacts! 🎯