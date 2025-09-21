# ProspectPro - Enhanced Lead Discovery Platform v2.0

## 🚀 Latest Features (September 2025)

### Enhanced CSV Export System
- **Multi-Query Campaigns**: Build comprehensive datasets across multiple searches
- **45+ Column CSV Export**: Complete business intelligence with owner/company contact differentiation  
- **Campaign Analytics**: Query-level analysis with cost efficiency and quality metrics
- **Testing Support**: Rich metadata for algorithm optimization and A/B testing

### Zero Fake Data Architecture
ProspectPro maintains **zero tolerance for fake business data** through:

- Real-time Google Places API integration
- Multi-source validation (Hunter.io, NeverBounce, State Registries)
- Sophisticated owner detection algorithms with name matching
- 80%+ email deliverability requirements
- Website accessibility verification

## Installation & Setup

### Prerequisites
- Node.js 16+ 
- PostgreSQL database (Supabase recommended)
- API keys for Google Places, Hunter.io, NeverBounce

### Quick Start

```bash
git clone https://github.com/yourusername/ProspectPro.git
cd ProspectPro
npm install
cp .env.example .env
```

### Environment Configuration

```env
# Required APIs
GOOGLE_PLACES_API_KEY=your_google_places_key
HUNTER_IO_API_KEY=your_hunter_io_key
NEVERBOUNCE_API_KEY=your_neverbounce_key

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key

# Optional APIs for enhanced validation
FOURSQUARE_API_KEY=your_foursquare_key
ZEROBOUNCE_API_KEY=your_zerobounce_key
```

### Database Setup

```bash
# Run database migrations
node database/database-master-setup.js

# Validate setup  
node database/validate-setup.js
```

### Start Development Server

```bash
npm run dev  # Development with auto-reload
# Server starts on http://localhost:3000
```

## API Usage Examples

### Single Query with CSV Export

```javascript
const response = await fetch('http://localhost:3000/api/business/discover', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'pizza restaurants',
    location: 'Austin, TX',
    count: 20,
    budgetLimit: 5.0,
    qualityThreshold: 75,
    exportToCsv: true
  })
});

const result = await response.json();
console.log(`Found ${result.results.length} qualified leads`);
console.log(`CSV: ${result.csvExport.filename}`);
console.log(`Campaign ID: ${result.campaignTracking.campaignId}`);
```

### Multi-Query Campaign Workflow

```javascript
// 1. Start new campaign
const campaign = await fetch('http://localhost:3000/api/business/campaign/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaignName: 'Austin Restaurant Market Analysis',
    description: 'Comprehensive food scene research'
  })
});

const { campaignId } = await campaign.json();

// 2. Add multiple queries to campaign
const queries = [
  { query: 'pizza restaurants', location: 'Austin, TX' },
  { query: 'taco shops', location: 'Austin, TX' },
  { query: 'barbecue restaurants', location: 'Austin, TX' },
  { query: 'food trucks', location: 'Austin, TX' }
];

for (const queryData of queries) {
  const queryResult = await fetch('http://localhost:3000/api/business/campaign/add-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      campaignId,
      ...queryData,
      count: 25,
      qualityThreshold: 70
    })
  });
  
  const query = await queryResult.json();
  console.log(`Added query: ${query.queryMetadata.leadCount} leads found`);
}

// 3. Export comprehensive campaign dataset
const exportResult = await fetch('http://localhost:3000/api/business/campaign/export', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ campaignId })
});

const exportData = await exportResult.json();
console.log(`Campaign exported: ${exportData.export.filename}`);
console.log(`Total: ${exportData.export.leadCount} leads across ${exportData.export.queryCount} queries`);
console.log(`Analysis: ${exportData.export.analysisUrl}`);
console.log(`Summary: ${exportData.export.summaryUrl}`);
```

## Enhanced CSV Export Features

### Comprehensive Data Structure (45+ Columns)

#### Campaign Tracking
- Campaign ID, Query ID, Search Query, Location, Timestamps

#### Business Information  
- Name, Address, Category, Rating, Reviews, Price Level

#### Contact Differentiation
- **Company Contacts**: Main business phone/email
- **Owner Contacts**: Owner-specific phone/email with confidence scores
- **Owner Details**: Name, title, source attribution

#### Validation & Quality
- Confidence scores (0-100), Quality grades (A-F)
- Registry validation, Email deliverability, Website accessibility
- Property intelligence, API cost breakdown

#### Testing & Analysis
- Individual scoring metrics (name, address, phone, website, email)
- Pre-validation scores, Processing times, Source attribution
- Technical identifiers (Google Place ID, Foursquare ID)

### Generated Files

Each campaign export creates:

1. **Main CSV** - Complete lead dataset with all 45+ columns
2. **Campaign Summary JSON** - Query-level analysis and totals  
3. **Analysis Data JSON** - Testing metrics and optimization insights

## Key Features

### Owner vs Company Contact Detection

The system intelligently differentiates between business contacts and owner contacts:

```csv
Business Name,Company Email,Owner Email,Owner Name,Owner Title,Owner Email Confidence
Trevor Caudle Law Practice,haley@trevorcaudlelaw.com,trevor@trevorcaudlelaw.com,Trevor Caudle,Accountant,98
```

**Detection Algorithm**:
- Position-based analysis (CEO, Owner, Founder, etc.)
- Name matching with business name for edge cases
- 80%+ confidence threshold for owner classification
- Separate confidence scoring for each contact type

### Quality Assurance Pipeline

1. **Pre-validation Screening** (0-100 score)
2. **Google Places Discovery** (Primary source)
3. **Multi-source Enrichment** (Hunter.io, Foursquare, etc.)
4. **Validation & Verification** (NeverBounce, website checks)
5. **Quality Scoring & Grading** (A-F grades)
6. **Export Readiness Assessment**

### Cost Optimization

- **Budget-aware processing** with configurable limits
- **Pre-screening** to avoid expensive APIs on low-quality leads  
- **API rate limiting** and intelligent queuing
- **Cost per lead tracking** typically $0.05-0.15 per qualified lead

## API Endpoints

### Core Discovery
- `POST /api/business/discover` - Single query discovery with optional campaign
- `GET /api/business/stats` - Campaign statistics and metrics

### Campaign Management
- `POST /api/business/campaign/start` - Initialize new campaign
- `POST /api/business/campaign/add-query` - Add query to existing campaign  
- `GET /api/business/campaign/status/:campaignId` - Get campaign status
- `POST /api/business/campaign/export` - Export complete campaign

### File Downloads
- `GET /api/business/download-csv/:filename` - Download CSV/JSON files

## Project Structure

```
ProspectPro/
├── api/                    # API endpoints
│   ├── business-discovery.js
│   └── campaign-export.js
├── modules/                # Core logic
│   ├── enhanced-lead-discovery.js
│   ├── campaign-csv-exporter.js
│   └── api-clients/        # External API integrations
├── database/               # Database schemas and setup
├── frontend/               # Web interface
├── exports/                # Generated CSV files
├── docs/                   # Documentation
└── test/                   # Testing utilities
```

## Testing & Validation

### Real Data Validation
```bash
node test/test-real-data.js         # Verify zero fake data patterns
node test/test-website-validation.js # Test website accessibility  
node debug/inspect-business-data.js  # Debug specific business data
```

### Performance Testing
```bash
node run-production-test.js         # End-to-end production test
node iterative-testing-framework.js # Algorithm optimization testing
```

## Deployment

### Railway (Recommended)
```bash
# Configure environment variables in Railway dashboard
railway up
```

### Docker
```bash
docker build -t prospectpro .
docker run -p 3000:3000 --env-file .env prospectpro
```

### Manual Deployment
```bash
npm install --production
npm start
```

## Documentation

- [Enhanced CSV Export System](docs/ENHANCED_CSV_EXPORT_SYSTEM.md) - Complete v2.0 export guide
- [API Keys Integration Guide](docs/API_KEYS_INTEGRATION_GUIDE.md) - Setup instructions
- [Database Setup Guide](docs/DATABASE_CONNECTION_SETUP.md) - Supabase configuration
- [Technical Overview](docs/TECHNICAL_OVERVIEW.md) - Architecture details

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions, issues, or feature requests:

- Create an issue on GitHub
- Check existing documentation in `/docs`
- Review the API examples above

---

**ProspectPro v2.0** - Enterprise-grade lead generation with comprehensive campaign analytics and zero fake data guarantee.