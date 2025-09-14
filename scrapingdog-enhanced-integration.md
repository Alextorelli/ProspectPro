# ScrapingDog Enhanced Integration - Immediate Implementation Guide

## Overview
ScrapingDog offers comprehensive web scraping APIs including specialized Google Maps scraping for local lead generation. Current pricing: 1,000 free credits, then $40/month (50,000 credits).

## Cost Analysis & Optimization

### Pricing Structure (2025):
- **Free Tier**: 1,000 credits (testing)
- **Lite Plan**: $40/month (50,000 credits) = $0.0008 per credit
- **Standard Plan**: $90/month (125,000 credits) = $0.00072 per credit  
- **Pro Plan**: $200/month (300,000 credits) = $0.00067 per credit
- **Premium Plan**: $350/month (600,000 credits) = $0.00058 per credit

### Credit Usage by API:
- **General Web Scraping**: 1 credit (basic) to 25 credits (premium proxy + JS)
- **Google Maps API**: 5 credits per search
- **LinkedIn Scraping**: 50-100 credits per profile
- **Indeed Scraper**: 1 credit per job listing
- **Instagram Scraper**: 15 credits per profile

### Cost Per Lead Analysis:
- **Google Maps Lead**: ~$0.004 (5 credits × $0.0008)
- **Website Enrichment**: ~$0.001 (1 credit for basic scraping)
- **Social Media Profile**: ~$0.012 (15 credits × $0.0008)

## Immediate Implementation (Week 1-2)

### Phase 1: Enhanced Google Maps Integration

#### Google Maps API Capabilities:
```javascript
// Enhanced local business discovery
const GOOGLE_MAPS_BASE = 'https://api.scrapingdog.com/google_maps';

// Search parameters
const searchLocalBusinesses = async (query, coordinates, page = 0) => {
  const params = {
    api_key: process.env.SCRAPINGDOG_API_KEY,
    query: query, // e.g., "restaurants in Austin TX"
    ll: coordinates, // e.g., "@40.6974881,-73.979681,10z"
    page: page
  };
  
  const response = await fetch(`${GOOGLE_MAPS_BASE}?${new URLSearchParams(params)}`);
  return await response.json();
};
```

#### Data Fields Available:
- **Business Name**: `title`
- **Address**: `address` 
- **Phone Number**: `phone`
- **Website**: `website`
- **Rating**: `rating`
- **Reviews Count**: `reviews_count`
- **Business Hours**: `hours`
- **Business Type**: `types`
- **Data ID**: `data_id` (for reviews scraping)

### Phase 2: Google Maps Reviews Integration

#### Reviews API for Business Intelligence:
```javascript
// Get business reviews for sentiment analysis
const getBusinessReviews = async (dataId) => {
  const params = {
    api_key: process.env.SCRAPINGDOG_API_KEY,
    data_id: dataId
  };
  
  const response = await fetch(`https://api.scrapingdog.com/google_maps/reviews?${new URLSearchParams(params)}`);
  return await response.json();
};

// Example data_id from Google Maps URL:
// https://www.google.com/maps/place/Business/@lat,lng,zoom/data=!3m1!1s0x89c2585144ec67ad:0xbfef005e94c9d209
// data_id = "0x89c2585144ec67ad:0xbfef005e94c9d209"
```

#### Review Data Fields:
- **Rating**: `rating` (1-5 stars)
- **Review Text**: `snippet`
- **Review Date**: `date`
- **Reviewer Name**: `user.name`
- **Reviewer Stats**: `user.reviews`, `user.photos`

## Enhanced ProspectPro Integration

### Smart Lead Discovery Algorithm:
```javascript
class EnhancedScrapingDogClient {
  constructor(apiKey, monthlyBudget = 200) {
    this.apiKey = apiKey;
    this.budget = monthlyBudget;
    this.creditUsage = 0;
    this.mapsBase = 'https://api.scrapingdog.com/google_maps';
    this.generalBase = 'https://api.scrapingdog.com';
  }

  // Multi-radius search for comprehensive coverage
  async searchBusinessesMultiRadius(query, centerCoords, radiusKm = [1, 5, 10]) {
    const allResults = [];
    
    for (const radius of radiusKm) {
      const coords = `${centerCoords},${radius}z`;
      const results = await this.searchLocalBusinesses(query, coords);
      
      // Deduplicate by phone/address
      const newResults = results.search_results.filter(business => 
        !allResults.some(existing => 
          existing.phone === business.phone || 
          existing.address === business.address
        )
      );
      
      allResults.push(...newResults);
      
      // Budget check
      if (this.creditUsage > this.budget * 0.8) break;
    }
    
    return allResults;
  }

  // Enhanced business enrichment with website scraping
  async enrichBusinessData(businesses) {
    const enrichedBusinesses = [];
    
    for (const business of businesses) {
      try {
        // Add website data if URL exists
        if (business.website && business.website.startsWith('http')) {
          const websiteData = await this.scrapeWebsite(business.website);
          business.website_content = websiteData;
          business.emails = this.extractEmails(websiteData);
          business.social_links = this.extractSocialLinks(websiteData);
        }
        
        // Add review sentiment if data_id exists
        if (business.data_id) {
          const reviews = await this.getBusinessReviews(business.data_id);
          business.review_sentiment = this.analyzeSentiment(reviews);
          business.review_count = reviews.length;
          business.avg_rating = business.rating;
        }
        
        enrichedBusinesses.push(business);
        
      } catch (error) {
        console.error(`Error enriching business ${business.title}:`, error);
        enrichedBusinesses.push(business); // Add without enrichment
      }
    }
    
    return enrichedBusinesses;
  }

  // Website scraping for contact discovery
  async scrapeWebsite(url) {
    const params = {
      api_key: this.apiKey,
      url: url,
      premium: false // Use basic proxy to save credits
    };
    
    this.creditUsage += 1; // Track credit usage
    
    const response = await fetch(`${this.generalBase}?${new URLSearchParams(params)}`);
    return await response.text();
  }

  // Email extraction from website content
  extractEmails(htmlContent) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = htmlContent.match(emailRegex) || [];
    
    // Filter out common false positives
    return emails.filter(email => 
      !email.includes('example.com') &&
      !email.includes('test@') &&
      !email.includes('noreply@')
    );
  }

  // Social media link extraction
  extractSocialLinks(htmlContent) {
    const socialPatterns = {
      facebook: /https?:\/\/(www\.)?facebook\.com\/[^\/\s]+/g,
      linkedin: /https?:\/\/(www\.)?linkedin\.com\/[^\/\s]+/g,
      twitter: /https?:\/\/(www\.)?twitter\.com\/[^\/\s]+/g,
      instagram: /https?:\/\/(www\.)?instagram\.com\/[^\/\s]+/g
    };
    
    const socialLinks = {};
    Object.entries(socialPatterns).forEach(([platform, regex]) => {
      const matches = htmlContent.match(regex);
      if (matches) socialLinks[platform] = matches[0];
    });
    
    return socialLinks;
  }

  // Sentiment analysis from reviews
  analyzeSentiment(reviews) {
    if (!reviews || reviews.length === 0) return null;
    
    const sentimentScore = reviews.reduce((acc, review) => {
      return acc + review.rating;
    }, 0) / reviews.length;
    
    const positiveReviews = reviews.filter(r => r.rating >= 4).length;
    const negativeReviews = reviews.filter(r => r.rating <= 2).length;
    
    return {
      average_rating: sentimentScore,
      positive_percentage: (positiveReviews / reviews.length) * 100,
      negative_percentage: (negativeReviews / reviews.length) * 100,
      total_reviews: reviews.length
    };
  }
}
```

## Cost Optimization Strategies

### Smart Credit Management:
```javascript
// Priority-based scraping to maximize ROI
const prioritizeBusinesses = (businesses) => {
  return businesses
    .map(business => ({
      ...business,
      priority: calculatePriority(business)
    }))
    .sort((a, b) => b.priority - a.priority);
};

const calculatePriority = (business) => {
  let score = 0;
  
  // Has phone number: +20 points
  if (business.phone) score += 20;
  
  // Has website: +30 points  
  if (business.website) score += 30;
  
  // Good rating: +10 points
  if (business.rating >= 4.0) score += 10;
  
  // Many reviews: +15 points
  if (business.reviews_count >= 50) score += 15;
  
  // Business hours available: +5 points
  if (business.hours) score += 5;
  
  return score;
};

// Budget-aware processing
const processWithBudget = async (businesses, budgetLimit) => {
  const sortedBusinesses = prioritizeBusinesses(businesses);
  const processed = [];
  let creditsUsed = 0;
  
  for (const business of sortedBusinesses) {
    const estimatedCredits = estimateCreditsNeeded(business);
    
    if (creditsUsed + estimatedCredits > budgetLimit) {
      break; // Stop if budget would be exceeded
    }
    
    const enriched = await enrichBusinessData(business);
    processed.push(enriched);
    creditsUsed += estimatedCredits;
  }
  
  return { processed, creditsUsed, remaining: budgetLimit - creditsUsed };
};
```

### Batch Processing for Efficiency:
```javascript
// Process businesses in cost-effective batches
const batchEnrichBusinesses = async (businesses, batchSize = 50) => {
  const batches = [];
  
  for (let i = 0; i < businesses.length; i += batchSize) {
    batches.push(businesses.slice(i, i + batchSize));
  }
  
  const results = [];
  for (const batch of batches) {
    // Process batch with delay to respect rate limits
    const batchResults = await Promise.all(
      batch.map(async (business, index) => {
        // Stagger requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, index * 100));
        return await enrichBusinessData(business);
      })
    );
    
    results.push(...batchResults);
    
    // Brief pause between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
};
```

## Integration with ProspectPro Pipeline

### Enhanced Discovery Stage:
```javascript
// Replace basic Google Places with enhanced Maps API
const enhancedBusinessDiscovery = async (query, location, radius = 10) => {
  const scrapingDog = new EnhancedScrapingDogClient(process.env.SCRAPINGDOG_API_KEY);
  
  // Step 1: Multi-radius search for comprehensive coverage
  const coordinates = await geocodeLocation(location);
  const businesses = await scrapingDog.searchBusinessesMultiRadius(
    query, 
    coordinates,
    [radius / 2, radius, radius * 1.5]
  );
  
  // Step 2: Priority scoring and budget allocation
  const prioritized = prioritizeBusinesses(businesses);
  const budgetPerSearch = 200; // 200 credits per search campaign
  
  // Step 3: Enrich high-priority businesses
  const enriched = await scrapingDog.processWithBudget(prioritized, budgetPerSearch);
  
  return {
    businesses: enriched.processed,
    stats: {
      total_found: businesses.length,
      processed: enriched.processed.length,
      credits_used: enriched.creditsUsed,
      cost: enriched.creditsUsed * 0.0008
    }
  };
};
```

### Enhanced Validation:
```javascript
// Add review sentiment to confidence scoring
const calculateEnhancedConfidence = (business) => {
  let confidence = 0;
  
  // Basic data completeness (40 points max)
  if (business.title) confidence += 10;
  if (business.phone) confidence += 10;  
  if (business.address) confidence += 10;
  if (business.website) confidence += 10;
  
  // Social proof (30 points max)
  if (business.rating >= 4.0) confidence += 15;
  if (business.review_count >= 10) confidence += 10;
  if (business.review_sentiment?.positive_percentage >= 70) confidence += 5;
  
  // Contact data (30 points max)
  if (business.emails?.length > 0) confidence += 15;
  if (business.social_links?.linkedin) confidence += 10;
  if (business.website_content?.includes('contact')) confidence += 5;
  
  return Math.min(100, confidence);
};
```

## Expected Results & ROI

### Performance Improvements:
- **Lead Discovery**: 40-60% more local businesses found
- **Contact Data**: 50-70% improvement in email/social discovery  
- **Business Intelligence**: Sentiment analysis for lead qualification
- **Cost Efficiency**: $0.004-0.012 per enriched lead (vs. $0.50+ current)

### Quality Metrics:
- **Data Completeness**: 80%+ businesses with phone + address
- **Contact Discovery**: 60%+ with email or social media  
- **Review Intelligence**: Sentiment scoring for 70%+ businesses
- **Geographic Coverage**: 3x larger search radius capability

## Implementation Timeline

### Week 1: Google Maps Integration
1. Set up ScrapingDog API client with budget controls
2. Implement multi-radius search algorithm
3. Add basic business enrichment pipeline
4. Test with small geography (1-2 cities)

### Week 2: Website Scraping Enhancement  
1. Add website content analysis
2. Implement email/social extraction
3. Create priority scoring system
4. Deploy batch processing logic

### Week 3: Review Intelligence
1. Integrate Google Maps Reviews API
2. Build sentiment analysis pipeline
3. Add review-based confidence scoring
4. Create quality dashboards

### Week 4: Optimization & Scale
1. Fine-tune budget allocation
2. Optimize credit usage patterns
3. A/B test vs. existing discovery
4. Scale to production volumes

## Environment Variables

```bash
# ScrapingDog Configuration
SCRAPINGDOG_API_KEY=your_scrapingdog_key_here
SCRAPINGDOG_MONTHLY_BUDGET=200
SCRAPINGDOG_BATCH_SIZE=50

# Feature flags
ENABLE_GOOGLE_MAPS_SCRAPING=true
ENABLE_WEBSITE_ENRICHMENT=true
ENABLE_REVIEW_ANALYSIS=true

# Performance settings
SCRAPINGDOG_RATE_LIMIT_MS=100
SCRAPINGDOG_CONCURRENT_REQUESTS=10
```

This enhanced ScrapingDog integration transforms ProspectPro from basic business discovery into comprehensive local market intelligence with sentiment analysis and deep contact enrichment at 90% lower cost per lead.