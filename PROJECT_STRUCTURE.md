# ProspectPro v2.0 - Project Structure

## Overview
ProspectPro is an enterprise-grade lead generation platform with advanced campaign management, multi-query support, and comprehensive business intelligence analytics.

## Core Architecture

```
ProspectPro/
├── 📁 api/                          # API endpoints and routing
│   ├── business-discovery.js        # Main discovery endpoint with campaign support
│   ├── campaign-export.js          # Campaign-specific export utilities
│   └── dashboard-metrics.js        # Analytics and metrics endpoints
│
├── 📁 modules/                      # Core business logic
│   ├── enhanced-lead-discovery.js  # Main discovery algorithm
│   ├── campaign-csv-exporter.js    # v2.0 campaign export system
│   ├── 📁 api-clients/             # External API integrations
│   ├── 📁 validators/              # Data validation modules
│   ├── 📁 scrapers/                # Web scraping utilities
│   └── 📁 logging/                 # Campaign and error logging
│
├── 📁 database/                     # Database setup and migrations
│   ├── database-master-setup.js    # Complete database initialization
│   ├── validate-setup.js           # Database validation
│   └── *.sql                       # Schema definitions and migrations
│
├── 📁 docs/                         # Comprehensive documentation
│   ├── ENHANCED_CSV_EXPORT_SYSTEM.md  # v2.0 export system guide
│   ├── API_KEYS_INTEGRATION_GUIDE.md  # API setup instructions
│   └── TECHNICAL_OVERVIEW.md          # System architecture
│
├── 📁 frontend/                     # Web interface (optional)
├── 📁 public/                       # Static web assets
├── 📁 exports/                      # Generated CSV and analysis files
├── 📁 test/                         # Testing utilities and validation
├── 📁 config/                       # Configuration files
└── server.js                       # Main application server
```

## Key Features

### ✅ Enhanced CSV Export System v2.0
- **Multi-Query Campaigns**: Build comprehensive datasets across multiple searches
- **45+ Column Export**: Complete business intelligence with owner/company differentiation
- **Campaign Analytics**: Query-level analysis with cost and quality metrics
- **Three-File Output**: CSV + Campaign Summary JSON + Analysis Data JSON

### ✅ Advanced Contact Classification
- **Owner Detection**: Sophisticated algorithm with name matching for edge cases
- **Contact Differentiation**: Separate company vs owner phone/email with confidence scores
- **Source Attribution**: Complete tracking of data source for each field
- **Quality Scoring**: 0-100% confidence scores with A-F grade system

### ✅ Real-Time Business Discovery
- **Google Places Integration**: Primary business discovery source
- **Multi-Source Validation**: Hunter.io, NeverBounce, Foursquare, State Registries
- **Zero Fake Data Policy**: Strict validation against generic/fake business patterns
- **Cost Optimization**: Budget-aware processing with pre-validation screening

## API Endpoints

### Campaign Management
- `POST /api/business/campaign/start` - Initialize new campaign
- `POST /api/business/campaign/add-query` - Add query to existing campaign
- `GET /api/business/campaign/status/:id` - Get campaign status and metrics
- `POST /api/business/campaign/export` - Export complete campaign dataset

### Business Discovery
- `POST /api/business/discover` - Enhanced single query with optional campaign support
- `GET /api/business/stats` - Campaign statistics and performance metrics
- `GET /api/business/download-csv/:filename` - Download exported files

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /diag` - Comprehensive system diagnostics
- `GET /metrics` - Prometheus metrics endpoint

## Configuration

### Required Environment Variables
```env
# Core APIs
GOOGLE_PLACES_API_KEY=your_key
HUNTER_IO_API_KEY=your_key
NEVERBOUNCE_API_KEY=your_key

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_key

# Optional Enhancement APIs  
FOURSQUARE_API_KEY=your_key
ZEROBOUNCE_API_KEY=your_key
CALIFORNIA_SOS_API_KEY=your_key

# Security & Operations
PERSONAL_ACCESS_TOKEN=your_token
SKIP_AUTH_IN_DEV=true  # Development only
```

## Data Pipeline

### 4-Stage Processing
1. **Pre-Validation** (0-100% scoring) - Initial quality screening
2. **Discovery & Enrichment** - Google Places + multi-source data gathering
3. **Validation & Verification** - Email deliverability, website accessibility
4. **Quality Scoring & Export** - Final confidence calculation and CSV generation

### Quality Assurance
- **Business Name Validation**: No generic patterns ("Business LLC", etc.)
- **Address Verification**: Real geocoded locations, no sequential fakes
- **Phone Validation**: Exclude 555-xxx and 000-xxx patterns
- **Website Testing**: HTTP 200-399 status requirement
- **Email Verification**: 80%+ deliverability confidence threshold

## Deployment

### Development
```bash
npm install
cp .env.example .env  # Configure API keys
npm run dev          # Start with auto-reload
```

### Production (Railway)
```bash
railway up           # Auto-deploy from main branch
```

### Docker
```bash
docker build -t prospectpro .
docker run -p 3000:3000 --env-file .env prospectpro
```

## Monitoring & Analytics

### Built-in Metrics
- **Campaign Performance**: Query success rates, cost efficiency
- **API Usage Tracking**: Request counts, costs, rate limits
- **Quality Metrics**: Confidence distributions, source effectiveness
- **System Performance**: Response times, error rates, uptime

### Export Analytics
- **Cost Per Lead**: Typical $0.02-0.05 for qualified leads
- **Processing Time**: ~7-8 seconds per query
- **Quality Distribution**: Confidence score breakdowns
- **Source Effectiveness**: Performance comparison across APIs

## Version History

### v2.0 (Current)
- ✅ Multi-query campaign system
- ✅ 45+ column CSV export with business intelligence
- ✅ Advanced owner vs company contact differentiation
- ✅ Comprehensive campaign analytics
- ✅ Three-file export system (CSV + JSON analysis)

### v1.0 (Legacy)
- Single query CSV export (16 columns)
- Basic contact discovery
- Simple validation pipeline

## Support & Documentation

### Primary Documentation
- [Enhanced CSV Export System](docs/ENHANCED_CSV_EXPORT_SYSTEM.md) - Complete v2.0 guide
- [Implementation Complete](IMPLEMENTATION_COMPLETE_V2.md) - Full feature summary
- [Iterative Testing](ITERATIVE_TESTING_V2.md) - Testing procedures and validation

### Technical Resources
- [Database Setup](docs/DATABASE_CONNECTION_SETUP.md) - Supabase configuration
- [API Integration](docs/API_KEYS_INTEGRATION_GUIDE.md) - External API setup
- [Technical Overview](docs/TECHNICAL_OVERVIEW.md) - Architecture details

---

**ProspectPro v2.0** - Enterprise lead generation with comprehensive campaign analytics and zero fake data guarantee.