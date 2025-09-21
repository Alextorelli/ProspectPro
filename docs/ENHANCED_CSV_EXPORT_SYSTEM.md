# Enhanced CSV Export System v2.0

## Overview

The Enhanced CSV Export System provides comprehensive campaign tracking and analysis capabilities for ProspectPro lead generation. This system supports multi-query campaigns with detailed metadata, testing data, and analysis outputs.

## Key Features

### 🆔 Campaign Tracking
- **Unique Campaign IDs**: Each campaign session gets a unique identifier
- **Query-level Tracking**: Individual queries within campaigns are tracked
- **Multi-Query Support**: Build comprehensive datasets across multiple searches
- **Session Persistence**: Campaign data persists across multiple API calls

### 📊 Enhanced CSV Structure

The new CSV export includes **45+ columns** of comprehensive data:

#### Campaign & Query Metadata
- `Campaign ID` - Unique campaign identifier
- `Query ID` - Individual query identifier within campaign
- `Search Query` - Original search terms used
- `Search Location` - Geographic search location
- `Query Timestamp` - When the query was executed

#### Business Information
- `Business Name` - Verified business name
- `Address` - Complete business address
- `Category` - Business category/type
- `Rating` - Google rating (1-5 stars)
- `Review Count` - Number of reviews
- `Price Level` - Cost indicator ($-$$$$)

#### Company vs Owner Contact Differentiation
- `Company Phone` / `Company Email` - Main business contacts
- `Owner Phone` / `Owner Email` - Owner-specific contacts
- `Owner Name` / `Owner Title` - Owner identification
- **Confidence Scores** - Verification confidence for each contact
- **Source Attribution** - Which API provided each contact

#### Digital Presence & Validation
- `Website` - Business website URL
- `Website Accessible` - Accessibility verification (true/false)
- `Website Response Time` - Performance metrics
- **Registry Validation** - State/federal registration status
- **Email Validation** - Deliverability verification
- **Property Intelligence** - Commercial property verification

#### Quality & Analysis Metrics
- `Confidence Score` - Overall lead quality score (0-100)
- `Quality Grade` - A-F quality assessment
- `Is Qualified` / `Export Ready` - Quality thresholds
- **Individual Scoring** - Business name, address, phone, website, email scores
- `Pre-validation Score` - Initial screening score

#### Technical & Testing Data
- `API Cost` - Cost breakdown per lead
- `Processing Time` - Performance metrics
- `Data Sources` - All APIs used for the lead
- `Google Place ID` / `Foursquare ID` - Technical identifiers
- `Business Hours` - Operating hours data

### 📋 Campaign Summary Files

Each campaign export generates **3 files**:

1. **Main CSV** - Complete lead data with all columns
2. **Campaign Summary JSON** - Query-level analysis and totals
3. **Analysis Data JSON** - Testing metrics and optimization insights

## API Endpoints

### Single Query with Campaign Support
```bash
POST /api/business/discover
{
  "query": "pizza restaurants",
  "location": "Austin, TX",
  "count": 10,
  "exportToCsv": true,
  "campaignId": "campaign_1234567890_abc123" // Optional
}
```

### Multi-Query Campaign Management

#### Start New Campaign
```bash
POST /api/business/campaign/start
{
  "campaignName": "Austin Restaurant Analysis",
  "description": "Comprehensive analysis of Austin food scene",
  "targetQueries": ["pizza", "tacos", "bbq"]
}
```

#### Add Query to Campaign
```bash
POST /api/business/campaign/add-query
{
  "campaignId": "campaign_1234567890_abc123",
  "query": "taco restaurants",
  "location": "Austin, TX",
  "count": 15,
  "qualityThreshold": 75
}
```

#### Export Campaign
```bash
POST /api/business/campaign/export
{
  "campaignId": "campaign_1234567890_abc123"
}
```

#### Check Campaign Status
```bash
GET /api/business/campaign/status/campaign_1234567890_abc123
```

## Campaign Analysis Features

### Quality Distribution Analysis
```json
{
  "confidenceDistribution": {
    "90-100": 25,
    "80-89": 45,
    "70-79": 20,
    "60-69": 8,
    "50-59": 2,
    "0-49": 0
  },
  "qualityGradeDistribution": {
    "A": 15,
    "B": 35,
    "C": 30,
    "D": 15,
    "F": 5
  }
}
```

### Source Effectiveness Analysis
```json
{
  "sourceEffectiveness": {
    "Google Places": {
      "count": 100,
      "averageConfidence": 85,
      "qualificationRate": 75
    },
    "Hunter.io": {
      "count": 80,
      "averageConfidence": 92,
      "qualificationRate": 88
    }
  }
}
```

### Cost Efficiency Metrics
```json
{
  "costEfficiency": {
    "totalCost": 5.25,
    "qualifiedLeads": 65,
    "costPerQualifiedLead": "0.081",
    "costPerLead": "0.053"
  }
}
```

## Testing & Analysis Support

### Pre-validation Accuracy
- Compare pre-validation scores with final quality scores
- Identify patterns in screening effectiveness
- Optimize cost by improving initial filtering

### API Cost Efficiency
- Track cost per API per lead
- Identify expensive APIs with low value
- Optimize API usage patterns

### Data Quality Metrics
- **Completeness Scores** - Field population rates
- **Accuracy Metrics** - Validation success rates  
- **Consistency Analysis** - Cross-source validation
- **Source Reliability** - API accuracy tracking

### Processing Optimization
- Query processing times
- API response time analysis
- Bottleneck identification
- Performance recommendations

## Usage Examples

### Basic Single Query
```javascript
const response = await fetch('/api/business/discover', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'law firms',
    location: 'San Francisco, CA',
    count: 20,
    exportToCsv: true
  })
});

const result = await response.json();
console.log('CSV exported:', result.csvExport.filename);
console.log('Campaign ID:', result.campaignTracking.campaignId);
```

### Multi-Query Campaign
```javascript
// Start campaign
const campaign = await fetch('/api/business/campaign/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaignName: 'Legal Services Analysis',
    description: 'Comprehensive legal market research'
  })
});

const { campaignId } = await campaign.json();

// Add multiple queries
const queries = [
  { query: 'personal injury lawyers', location: 'San Francisco, CA' },
  { query: 'family law attorneys', location: 'San Francisco, CA' },
  { query: 'corporate lawyers', location: 'San Francisco, CA' }
];

for (const queryData of queries) {
  await fetch('/api/business/campaign/add-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      campaignId,
      ...queryData,
      count: 25
    })
  });
}

// Export comprehensive campaign
const exportResult = await fetch('/api/business/campaign/export', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ campaignId })
});

const exportData = await exportResult.json();
console.log('Campaign exported:', exportData.export.filename);
console.log('Total leads:', exportData.export.leadCount);
console.log('Analysis file:', exportData.export.analysisUrl);
```

## File Structure

### Exported Files
```
exports/
├── ProspectPro-Campaign-campaign_1234567890_abc123-2025-09-21T20-30-45-123Z.csv
├── ProspectPro-Campaign-campaign_1234567890_abc123-2025-09-21T20-30-45-123Z-summary.json
└── ProspectPro-Campaign-campaign_1234567890_abc123-2025-09-21T20-30-45-123Z-analysis.json
```

### CSV Columns (45+ fields)
1. Campaign ID
2. Query ID  
3. Search Query
4. Search Location
5. Query Timestamp
6. Business Name
7. Address
8. Category
9. Rating
10. Review Count
11. Price Level
12. Company Phone
13. Company Phone Source
14. Company Email
15. Company Email Source
16. Company Email Confidence
17. Owner Phone
18. Owner Phone Source
19. Owner Email
20. Owner Email Source
21. Owner Email Confidence
22. Owner Name
23. Owner Title
24. Website
25. Website Source
26. Website Accessible
27. Website Response Time
28. Confidence Score
29. Quality Grade
30. Is Qualified
31. Export Ready
32. Registry Validated
33. Email Validated
34. Property Intelligence
35. Foursquare Match
36. Primary Source
37. All Data Sources
38. API Cost
39. Processing Time
40. Business Name Score
41. Address Score
42. Phone Score
43. Website Score
44. Email Score
45. Registration Score
46. Pre-validation Score
47. Google Place ID
48. Foursquare ID
49. Business Hours

## Benefits

### For Testing & Analysis
- **Complete Audit Trail** - Every query and result tracked
- **A/B Testing Support** - Compare different parameters across queries
- **Performance Analysis** - Identify bottlenecks and optimization opportunities
- **Cost Analysis** - Track spending efficiency across campaigns

### For Business Intelligence
- **Market Analysis** - Comprehensive view across multiple searches
- **Competitive Analysis** - Track business landscapes over time
- **Quality Assurance** - Verify data quality and accuracy
- **ROI Tracking** - Measure campaign effectiveness

### For Data Science
- **Feature Engineering** - Rich dataset for ML model training
- **Quality Prediction** - Train models to predict lead quality
- **Cost Optimization** - Optimize API usage patterns
- **Success Forecasting** - Predict campaign outcomes

## Migration from v1.0

The system maintains **backward compatibility** with the original single-query CSV export. Existing integrations continue to work, while new campaigns can take advantage of enhanced features.

### Legacy Support
- Single query exports still work with original 16-column format
- New enhanced exports include all legacy columns plus 30+ new fields
- Existing API endpoints unchanged
- New campaign features are opt-in

This enhanced system transforms ProspectPro into a comprehensive lead generation analysis platform suitable for enterprise-scale market research and business intelligence applications.