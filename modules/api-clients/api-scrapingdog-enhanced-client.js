/**
 * Enhanced ScrapingDog Integration - Google Maps API + Website Scraping
 * Comprehensive local business discovery with sentiment analysis and cost optimization
 */

class EnhancedScrapingDogClient {
  constructor(apiKey, monthlyBudget = 200) {
    this.apiKey = apiKey;
    this.budget = monthlyBudget;
    this.creditUsage = 0;
    this.mapsBase = 'https://api.scrapingdog.com/google_maps';
    this.generalBase = 'https://api.scrapingdog.com';
    this.rateLimitDelay = 100; // ms between requests
    this.batchSize = 10;
  }

  /**
   * Multi-radius search for comprehensive local business coverage
   * @param {string} query - Business type/keyword search
   * @param {string} centerCoords - "lat,lng"
   * @param {Array<number>} radiusKm - Array of search radiuses
   * @returns {Promise<Array>} Deduplicated business results
   */
  async searchBusinessesMultiRadius(query, centerCoords, radiusKm = [1, 5, 10]) {
    console.log(`🎯 Multi-radius search: "${query}" near ${centerCoords}`);
    const allResults = [];
    
    for (const radius of radiusKm) {
      try {
        console.log(`📍 Searching radius: ${radius}km`);
        const coords = `${centerCoords},${radius}z`;
        const results = await this.searchLocalBusinesses(query, coords);
        
        if (results && results.search_results) {
          // Deduplicate by phone/address combination
          const newResults = results.search_results.filter(business => 
            !allResults.some(existing => 
              (existing.phone && business.phone && existing.phone === business.phone) ||
              (existing.address && business.address && 
               this.normalizeAddress(existing.address) === this.normalizeAddress(business.address))
            )
          );
          
          console.log(`✅ Found ${newResults.length} new businesses in ${radius}km radius`);
          allResults.push(...newResults);
        }
        
        // Budget check - stop if we're using too many credits
        if (this.creditUsage > this.budget * 0.8) {
          console.log(`⚠️ Approaching budget limit (${this.creditUsage}/${this.budget})`);
          break;
        }
        
        // Rate limiting between searches
        await this.delay(this.rateLimitDelay);
        
      } catch (error) {
        console.error(`❌ Error searching radius ${radius}km:`, error.message);
        continue;
      }
    }
    
    console.log(`🎉 Total unique businesses found: ${allResults.length}`);
    return allResults;
  }

  /**
   * Enhanced Google Maps local business search
   * @param {string} query - Search query
   * @param {string} coordinates - Location coordinates
   * @param {number} page - Results page (0-based)
   * @returns {Promise<Object>} Search results
   */
  async searchLocalBusinesses(query, coordinates, page = 0) {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      query: query,
      ll: coordinates,
      page: page.toString()
    });
    
    this.creditUsage += 5; // Google Maps API costs 5 credits per search
    
    try {
      const response = await fetch(`${this.mapsBase}?${params}`);
      
      if (!response.ok) {
        throw new Error(`ScrapingDog API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Enhance results with additional metadata
      if (data.search_results) {
        data.search_results = data.search_results.map(business => ({
          ...business,
          source: 'scrapingdog_maps',
          discovery_cost: 5 * 0.0008, // 5 credits at $0.0008/credit
          discovered_at: new Date().toISOString(),
          confidence_score: this.calculateBusinessConfidence(business)
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Google Maps search error:', error);
      throw error;
    }
  }

  /**
   * Get Google Maps reviews for business sentiment analysis
   * @param {string} dataId - Google Maps data_id
   * @returns {Promise<Array>} Business reviews
   */
  async getBusinessReviews(dataId) {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      data_id: dataId
    });
    
    this.creditUsage += 5; // Reviews API costs 5 credits
    
    try {
      const response = await fetch(`${this.mapsBase}/reviews?${params}`);
      
      if (!response.ok) {
        throw new Error(`Reviews API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.reviews || [];
    } catch (error) {
      console.error('Reviews fetch error:', error);
      return [];
    }
  }

  /**
   * Enhanced business enrichment with website scraping and email discovery
   * @param {Array} businesses - Array of business objects
   * @returns {Promise<Array>} Enriched businesses
   */
  async enrichBusinessData(businesses) {
    console.log(`🔍 Enriching ${businesses.length} businesses with website data...`);
    const enrichedBusinesses = [];
    
    // Process in batches to respect rate limits
    for (let i = 0; i < businesses.length; i += this.batchSize) {
      const batch = businesses.slice(i, i + this.batchSize);
      
      const batchPromises = batch.map(async (business, index) => {
        // Stagger requests to avoid rate limiting
        await this.delay(index * this.rateLimitDelay);
        
        try {
          const enrichedBusiness = { ...business };
          
          // Website scraping for contact discovery
          if (business.website && this.isValidWebsite(business.website)) {
            console.log(`🌐 Scraping website: ${business.website}`);
            const websiteData = await this.scrapeWebsite(business.website);
            
            if (websiteData) {
              enrichedBusiness.website_content = websiteData;
              enrichedBusiness.emails = this.extractEmails(websiteData);
              enrichedBusiness.social_links = this.extractSocialLinks(websiteData);
              enrichedBusiness.contact_info = this.extractContactInfo(websiteData);
            }
          }
          
          // Review sentiment analysis
          if (business.data_id) {
            console.log(`📊 Analyzing reviews for: ${business.title}`);
            const reviews = await this.getBusinessReviews(business.data_id);
            if (reviews.length > 0) {
              enrichedBusiness.review_sentiment = this.analyzeSentiment(reviews);
              enrichedBusiness.review_count = reviews.length;
            }
          }
          
          // Update confidence score with new data
          enrichedBusiness.confidence_score = this.calculateEnhancedConfidence(enrichedBusiness);
          
          return enrichedBusiness;
          
        } catch (error) {
          console.error(`Error enriching business ${business.title}:`, error.message);
          return { ...business, enrichment_error: error.message };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      enrichedBusinesses.push(...batchResults);
      
      // Brief pause between batches
      if (i + this.batchSize < businesses.length) {
        await this.delay(1000);
      }
    }
    
    console.log(`✅ Enrichment complete. Found emails for ${enrichedBusinesses.filter(b => b.emails?.length > 0).length} businesses`);
    return enrichedBusinesses;
  }

  /**
   * Website scraping with error handling and cost tracking
   * @param {string} url - Website URL to scrape
   * @returns {Promise<string>} Website HTML content
   */
  async scrapeWebsite(url) {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      url: url,
      premium: 'false' // Use basic proxy to save credits
    });
    
    this.creditUsage += 1; // Basic web scraping costs 1 credit
    
    try {
      const response = await fetch(`${this.generalBase}?${params}`, {
        timeout: 30000 // 30 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Website scraping failed: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Extract emails from website content with filtering
   * @param {string} htmlContent - Website HTML content
   * @returns {Array<string>} Filtered email addresses
   */
  extractEmails(htmlContent) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = htmlContent.match(emailRegex) || [];
    
    // Filter out common false positives and spam traps
    const filteredEmails = emails.filter(email => {
      const lowerEmail = email.toLowerCase();
      return !lowerEmail.includes('example.com') &&
             !lowerEmail.includes('test@') &&
             !lowerEmail.includes('noreply@') &&
             !lowerEmail.includes('no-reply@') &&
             !lowerEmail.includes('donotreply@') &&
             !lowerEmail.includes('spam@') &&
             !lowerEmail.includes('abuse@') &&
             lowerEmail.length < 50; // Reasonable email length
    });
    
    // Remove duplicates and return unique emails
    return [...new Set(filteredEmails)];
  }

  /**
   * Extract social media links from website content
   * @param {string} htmlContent - Website HTML content
   * @returns {Object} Social media links by platform
   */
  extractSocialLinks(htmlContent) {
    const socialPatterns = {
      facebook: /https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9._-]+/g,
      linkedin: /https?:\/\/(www\.)?linkedin\.com\/[A-Za-z0-9/._-]+/g,
      twitter: /https?:\/\/(www\.)?twitter\.com\/[A-Za-z0-9._-]+/g,
      instagram: /https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._-]+/g,
      youtube: /https?:\/\/(www\.)?youtube\.com\/[A-Za-z0-9/._-]+/g
    };
    
    const socialLinks = {};
    Object.entries(socialPatterns).forEach(([platform, regex]) => {
      const matches = htmlContent.match(regex);
      if (matches && matches.length > 0) {
        // Take the first valid match
        socialLinks[platform] = matches[0];
      }
    });
    
    return socialLinks;
  }

  /**
   * Extract additional contact information from website
   * @param {string} htmlContent - Website HTML content
   * @returns {Object} Contact information
   */
  extractContactInfo(htmlContent) {
    const contactInfo = {};
    
    // Phone number patterns
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const phones = htmlContent.match(phoneRegex) || [];
    if (phones.length > 0) {
      contactInfo.additional_phones = [...new Set(phones.slice(0, 3))]; // Max 3 phones
    }
    
    // Address patterns (basic)
    const addressRegex = /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)/gi;
    const addresses = htmlContent.match(addressRegex) || [];
    if (addresses.length > 0) {
      contactInfo.additional_addresses = [...new Set(addresses.slice(0, 2))];
    }
    
    return contactInfo;
  }

  /**
   * Analyze sentiment from Google Maps reviews
   * @param {Array} reviews - Array of review objects
   * @returns {Object} Sentiment analysis results
   */
  analyzeSentiment(reviews) {
    if (!reviews || reviews.length === 0) return null;
    
    const sentimentScore = reviews.reduce((acc, review) => {
      return acc + (review.rating || 0);
    }, 0) / reviews.length;
    
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };
    
    const positiveReviews = reviews.filter(r => r.rating >= 4).length;
    const negativeReviews = reviews.filter(r => r.rating <= 2).length;
    
    return {
      average_rating: Number(sentimentScore.toFixed(1)),
      positive_percentage: Math.round((positiveReviews / reviews.length) * 100),
      negative_percentage: Math.round((negativeReviews / reviews.length) * 100),
      neutral_percentage: Math.round(((reviews.length - positiveReviews - negativeReviews) / reviews.length) * 100),
      total_reviews: reviews.length,
      rating_distribution: ratingDistribution,
      sentiment_label: this.getSentimentLabel(sentimentScore)
    };
  }

  /**
   * Calculate business confidence score based on available data
   * @param {Object} business - Business object
   * @returns {number} Confidence score (0-100)
   */
  calculateBusinessConfidence(business) {
    let confidence = 0;
    
    // Basic data completeness (40 points max)
    if (business.title) confidence += 10;
    if (business.phone) confidence += 10;
    if (business.address) confidence += 10;
    if (business.website && this.isValidWebsite(business.website)) confidence += 10;
    
    // Social proof (30 points max)
    if (business.rating >= 4.0) confidence += 15;
    if (business.reviews_count >= 10) confidence += 10;
    if (business.reviews_count >= 50) confidence += 5;
    
    // Business metadata (30 points max)
    if (business.hours) confidence += 10;
    if (business.types && business.types.length > 0) confidence += 10;
    if (business.data_id) confidence += 10; // Has Google Maps presence
    
    return Math.min(100, confidence);
  }

  /**
   * Calculate enhanced confidence score with enrichment data
   * @param {Object} business - Enriched business object
   * @returns {number} Enhanced confidence score (0-100)
   */
  calculateEnhancedConfidence(business) {
    let confidence = this.calculateBusinessConfidence(business);
    
    // Email discovery bonus (20 points max)
    if (business.emails && business.emails.length > 0) {
      confidence += 15;
      if (business.emails.length > 1) confidence += 5;
    }
    
    // Social media presence bonus (10 points max)
    if (business.social_links && Object.keys(business.social_links).length > 0) {
      confidence += 5;
      if (business.social_links.linkedin) confidence += 5; // LinkedIn is valuable for B2B
    }
    
    // Review sentiment bonus (10 points max)
    if (business.review_sentiment) {
      if (business.review_sentiment.positive_percentage >= 80) confidence += 10;
      else if (business.review_sentiment.positive_percentage >= 60) confidence += 5;
    }
    
    return Math.min(100, confidence);
  }

  /**
   * Utility functions
   */
  
  normalizeAddress(address) {
    return address.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,#-]/g, '')
      .trim();
  }
  
  isValidWebsite(url) {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol) &&
             !parsedUrl.hostname.includes('facebook.com') &&
             !parsedUrl.hostname.includes('instagram.com') &&
             !parsedUrl.hostname.includes('twitter.com');
    } catch {
      return false;
    }
  }
  
  getSentimentLabel(score) {
    if (score >= 4.5) return 'excellent';
    if (score >= 4.0) return 'very_good';
    if (score >= 3.5) return 'good';
    if (score >= 3.0) return 'average';
    if (score >= 2.5) return 'below_average';
    return 'poor';
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Budget and usage management
   */
  
  checkBudget() {
    return this.creditUsage < this.budget;
  }
  
  getRemainingBudget() {
    return Math.max(0, this.budget - this.creditUsage);
  }
  
  getCostSummary() {
    return {
      credits_used: this.creditUsage,
      estimated_cost: this.creditUsage * 0.0008,
      remaining_credits: this.getRemainingBudget(),
      budget_utilization: (this.creditUsage / this.budget) * 100
    };
  }
}

module.exports = EnhancedScrapingDogClient;