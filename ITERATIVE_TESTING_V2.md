# ProspectPro v2.0 - Iterative Testing Framework

## Overview

This branch contains the Enhanced CSV Export System v2.0 with comprehensive campaign tracking and multi-query support. This document provides testing procedures and validation steps for the new features.

## Testing Scope

### ✅ Core Features Enhanced
1. **Multi-Query Campaign Support** - Build datasets across multiple searches
2. **45+ Column CSV Export** - Comprehensive business intelligence data
3. **Owner vs Company Contact Differentiation** - Enhanced contact classification
4. **Campaign Analytics** - Query-level analysis and optimization metrics
5. **Testing Support** - Rich metadata for algorithm optimization

### 🔧 New API Endpoints
- `POST /api/business/campaign/start` - Initialize new campaign
- `POST /api/business/campaign/add-query` - Add query to existing campaign
- `GET /api/business/campaign/status/:campaignId` - Get campaign status
- `POST /api/business/campaign/export` - Export complete campaign

## Testing Procedures

### 1. Single Query with Enhanced CSV Export

```bash
# Test basic single query functionality
curl -X POST http://localhost:3000/api/business/discover \
  -H "Content-Type: application/json" \
  -d '{
    "query": "pizza restaurants",
    "location": "Austin, TX",
    "count": 5,
    "budgetLimit": 2.0,
    "qualityThreshold": 70,
    "exportToCsv": true
  }'
```

**Expected Results:**
- CSV export with 45+ columns
- Campaign ID returned for potential multi-query expansion
- Owner vs company contact differentiation
- Enhanced metadata in response

**Validation Steps:**
1. Check CSV has all expected columns (Campaign ID, Query ID, etc.)
2. Verify contact differentiation (owner email vs company email)
3. Confirm confidence scores are present and reasonable (80%+)
4. Validate source attribution for all data points

### 2. Multi-Query Campaign Workflow

#### Step 1: Start Campaign
```bash
curl -X POST http://localhost:3000/api/business/campaign/start \
  -H "Content-Type: application/json" \
  -d '{
    "campaignName": "Austin Food Scene Analysis",
    "description": "Comprehensive restaurant market research"
  }'
```

**Expected:** Campaign ID returned, ready for queries

#### Step 2: Add Multiple Queries
```bash
# Query 1: Pizza
curl -X POST http://localhost:3000/api/business/campaign/add-query \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "YOUR_CAMPAIGN_ID",
    "query": "pizza restaurants",
    "location": "Austin, TX",
    "count": 5,
    "qualityThreshold": 70
  }'

# Query 2: Tacos  
curl -X POST http://localhost:3000/api/business/campaign/add-query \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "YOUR_CAMPAIGN_ID",
    "query": "taco shops",
    "location": "Austin, TX", 
    "count": 5,
    "qualityThreshold": 70
  }'

# Query 3: BBQ
curl -X POST http://localhost:3000/api/business/campaign/add-query \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "YOUR_CAMPAIGN_ID",
    "query": "bbq restaurants",
    "location": "Austin, TX",
    "count": 5,
    "qualityThreshold": 70
  }'
```

**Expected:** Each query adds leads to campaign with unique query IDs

#### Step 3: Check Campaign Status
```bash
curl http://localhost:3000/api/business/campaign/status/YOUR_CAMPAIGN_ID
```

**Expected:** Campaign summary with all queries and totals

#### Step 4: Export Complete Campaign
```bash
curl -X POST http://localhost:3000/api/business/campaign/export \
  -H "Content-Type: application/json" \
  -d '{"campaignId": "YOUR_CAMPAIGN_ID"}'
```

**Expected:** 
- Comprehensive CSV with all queries combined
- Campaign summary JSON file
- Analysis data JSON file
- Download URLs for all files

### 3. Enhanced Contact Differentiation Testing

Test with businesses known to have owner-operated structures:

```bash
# Test law firm (owner detection)
curl -X POST http://localhost:3000/api/business/discover \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Trevor Caudle Law Practice",
    "location": "San Francisco, CA",
    "count": 1,
    "exportToCsv": true
  }'

# Test restaurant chain (company structure)
curl -X POST http://localhost:3000/api/business/discover \
  -H "Content-Type: application/json" \
  -d '{
    "query": "McDonald's",
    "location": "Austin, TX", 
    "count": 3,
    "exportToCsv": true
  }'
```

**Validation Criteria:**
- Owner email should have high confidence (80%+) for law firm
- Company email should be primary for chain restaurant
- Owner name should match business name for small businesses
- Proper source attribution for each contact type

### 4. CSV Export Structure Validation

**Required Columns (45+):**
1. Campaign ID
2. Query ID
3. Search Query
4. Search Location
5. Query Timestamp
6. Business Name
7. Address
8. Category
9. Company Phone
10. Company Email
11. Company Email Confidence
12. Owner Phone
13. Owner Email  
14. Owner Email Confidence
15. Owner Name
16. Owner Title
17. Website
18. Website Accessible
19. Confidence Score
20. Quality Grade
21. Registry Validated
22. Email Validated
23. Property Intelligence
24. Data Sources
25. API Cost
26. Processing Time
27. Business Name Score
28. Address Score
29. Phone Score
30. Website Score
31. Email Score
32. Pre-validation Score
33. Google Place ID
34. Foursquare ID
35. Business Hours
36. Rating
37. Review Count
38. Price Level
39. Is Qualified
40. Export Ready
41. Foursquare Match
42. Primary Source
43. Website Source
44. Website Response Time
45. Registration Score

**Validation Script:**
```javascript
// Check CSV columns
const fs = require('fs');
const csvPath = 'exports/your-exported-file.csv';
const csvContent = fs.readFileSync(csvPath, 'utf8');
const headers = csvContent.split('\n')[0].split(',');

console.log(`CSV has ${headers.length} columns`);
console.log('Headers:', headers);

// Verify required columns exist
const requiredColumns = [
  'Campaign ID', 'Query ID', 'Search Query', 'Owner Email', 
  'Company Email', 'Owner Email Confidence', 'Confidence Score'
];

const missingColumns = requiredColumns.filter(col => !headers.includes(col));
if (missingColumns.length === 0) {
  console.log('✅ All required columns present');
} else {
  console.log('❌ Missing columns:', missingColumns);
}
```

### 5. Campaign Analytics Validation

**Summary File Structure:**
```json
{
  "campaignOverview": {
    "campaignId": "campaign_xxx",
    "totalQueries": 3,
    "totalLeads": 15,
    "duration": 45000
  },
  "queryBreakdown": [
    {
      "queryId": "query_xxx",
      "query": "pizza restaurants",
      "leadCount": 5,
      "cost": 0.25,
      "qualificationRate": 80
    }
  ],
  "qualityAnalysis": {
    "confidenceDistribution": {
      "90-100": 5,
      "80-89": 8,
      "70-79": 2
    },
    "sourceEffectiveness": {
      "Google Places": {
        "count": 15,
        "averageConfidence": 85,
        "qualificationRate": 87
      }
    }
  }
}
```

**Analysis File Structure:**
```json
{
  "testingMetrics": {
    "preValidationAccuracy": "TBD",
    "apiCostEfficiency": {
      "googlePlacesUsage": {"requestCount": 3, "totalCost": 0.051},
      "hunterIOUsage": {"requests_used": 3, "daily_spend": 0.12}
    }
  },
  "optimizationInsights": {
    "costReductionOpportunities": ["Implement more aggressive pre-screening"],
    "qualityImprovementAreas": ["Add more validation sources"]
  }
}
```

## Performance Testing

### Load Testing Multi-Query Campaigns

```bash
# Test campaign with 10 queries
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/business/campaign/add-query \
    -H "Content-Type: application/json" \
    -d '{
      "campaignId": "YOUR_CAMPAIGN_ID",
      "query": "restaurant '$i'",
      "location": "Austin, TX",
      "count": 2
    }'
  echo "Query $i completed"
  sleep 2
done
```

**Performance Benchmarks:**
- Each query should complete in < 10 seconds
- Memory usage should remain stable across queries
- Campaign export should handle 50+ queries efficiently
- CSV export should complete in < 30 seconds for 100 leads

## Quality Assurance Checklist

### Data Quality
- [ ] Zero fake business names (no "Business LLC", "Company Inc")
- [ ] No sequential fake addresses (100 Main St, 110 Main St, etc.)
- [ ] No 555-xxxx phone numbers
- [ ] All websites return HTTP 200-399 status codes
- [ ] Email deliverability > 80% confidence

### Contact Differentiation
- [ ] Owner emails properly identified for small businesses
- [ ] Company emails used for corporate entities
- [ ] Name matching algorithm working for edge cases
- [ ] Confidence scores reasonable (80%+ for owners)
- [ ] Source attribution accurate

### Campaign Features
- [ ] Campaign IDs unique and persistent
- [ ] Query IDs unique within campaigns
- [ ] Multi-query data properly combined
- [ ] Campaign analytics accurate
- [ ] File exports complete and downloadable

### Backward Compatibility
- [ ] Single query exports still work
- [ ] Existing API endpoints unchanged
- [ ] Legacy CSV format still supported
- [ ] No breaking changes to existing integrations

## Error Handling Testing

### Invalid Inputs
```bash
# Test missing required fields
curl -X POST http://localhost:3000/api/business/campaign/add-query \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "invalid_id",
    "query": "test"
  }'
```
**Expected:** 400 error with clear message

### Edge Cases
- Empty query results
- API timeout scenarios  
- Invalid campaign IDs
- Expired campaign sessions
- Network connectivity issues

### Recovery Testing
- Server restart during campaign
- Database connectivity loss
- API key exhaustion
- Memory pressure scenarios

## Success Criteria

### Functional Requirements
- [ ] All new API endpoints working correctly
- [ ] CSV exports contain all 45+ expected columns
- [ ] Contact differentiation accuracy > 90%
- [ ] Campaign tracking persistent across sessions
- [ ] File downloads working for all export types

### Performance Requirements  
- [ ] Single query response time < 8 seconds
- [ ] Multi-query campaign addition < 10 seconds per query
- [ ] CSV export generation < 30 seconds for 100 leads
- [ ] Memory usage stable across large campaigns

### Quality Requirements
- [ ] Zero fake data in exports
- [ ] Email deliverability confidence > 80%
- [ ] Website accessibility verification 100% accurate  
- [ ] Owner detection accuracy > 85%
- [ ] Cost per qualified lead < $0.20

## Documentation Validation

### Required Documentation
- [ ] Enhanced CSV Export System guide complete
- [ ] API endpoint documentation with examples
- [ ] Migration guide from v1.0
- [ ] Testing procedures documented
- [ ] Error handling scenarios covered

### Code Documentation
- [ ] All new functions commented
- [ ] API endpoints documented with OpenAPI/Swagger
- [ ] Database schema changes documented
- [ ] Configuration variables explained

## Deployment Readiness

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Database migrations ready
- [ ] Environment variables documented
- [ ] Error monitoring configured
- [ ] Backup procedures verified

### Production Validation
- [ ] Health checks responding
- [ ] API endpoints accessible
- [ ] Database connections stable
- [ ] File export permissions correct
- [ ] External API integrations working

This testing framework ensures ProspectPro v2.0 meets all quality, performance, and functionality requirements before production deployment.