const axios = require('axios');
const cheerio = require('cheerio');

class ScrapingdogClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.scrapingdog.com/scrape';
    this.requestCount = 0;
    this.monthlyLimit = 1000; // Free tier limit
  }

  async scrapeWebsite(url) {
    if (this.requestCount >= this.monthlyLimit) {
      throw new Error('Scrapingdog monthly limit reached');
    }

    try {
      console.log(`🕷️  Scraping website: ${url}`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          api_key: this.apiKey,
          url: url,
          premium: false,
          render: false
        },
        timeout: 15000
      });

      this.requestCount++;
      const html = response.data;
      
      return this.extractContactInfo(html, url);

    } catch (error) {
      console.error(`Website scraping failed for ${url}:`, error.message);
      return null;
    }
  }

  extractContactInfo(html, websiteUrl) {
    const $ = cheerio.load(html);
    const domain = new URL(websiteUrl).hostname;

    const contactInfo = {
      url: websiteUrl,
      domain: domain,
      emails: this.extractEmails($, domain),
      phones: this.extractPhones($),
      contactNames: this.extractContactNames($),
      socialLinks: this.extractSocialLinks($),
      businessDescription: this.extractBusinessDescription($),
      scrapedAt: new Date().toISOString()
    };

    return contactInfo;
  }

  extractEmails($, domain) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const html = $.html();
    const emails = html.match(emailRegex) || [];
    
    // Filter for quality emails - prefer domain-specific emails
    const qualityEmails = emails
      .filter(email => {
        // Remove common spam/generic patterns
        const lowerEmail = email.toLowerCase();
        return !lowerEmail.includes('example') && 
               !lowerEmail.includes('test') &&
               !lowerEmail.includes('noreply') &&
               !lowerEmail.includes('donotreply');
      })
      .sort((a, b) => {
        // Prioritize domain-specific emails
        const aDomainMatch = a.includes(domain.replace('www.', ''));
        const bDomainMatch = b.includes(domain.replace('www.', ''));
        if (aDomainMatch && !bDomainMatch) return -1;
        if (!aDomainMatch && bDomainMatch) return 1;
        return 0;
      });

    return [...new Set(qualityEmails)]; // Remove duplicates
  }

  extractPhones($) {
    const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
    const html = $.html();
    const phones = html.match(phoneRegex) || [];
    
    // Clean and format phone numbers
    const cleanedPhones = phones
      .map(phone => phone.replace(/[^\d]/g, ''))
      .filter(phone => phone.length === 10)
      .map(phone => `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`);
    
    return [...new Set(cleanedPhones)]; // Remove duplicates
  }

  extractContactNames($) {
    const namePatterns = [
      'contact-name', 'owner-name', 'founder-name',
      'ceo-name', 'president-name', 'manager-name'
    ];
    
    const names = [];
    
    // Check for specific name classes/IDs
    namePatterns.forEach(pattern => {
      $(`.${pattern}, #${pattern}`).each((i, elem) => {
        const text = $(elem).text().trim();
        if (text && text.length > 2 && text.length < 50) {
          names.push(text);
        }
      });
    });

    // Extract from common contact sections
    $('section, div').filter((i, elem) => {
      const text = $(elem).text().toLowerCase();
      return text.includes('contact') || text.includes('about') || text.includes('team');
    }).find('h1, h2, h3, h4, strong, b').each((i, elem) => {
      const text = $(elem).text().trim();
      // Basic name pattern matching
      if (text.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/) && text.length < 30) {
        names.push(text);
      }
    });

    return [...new Set(names)]; // Remove duplicates
  }

  extractSocialLinks($) {
    const socialPatterns = {
      facebook: /facebook\.com\/[^\/\s]+/i,
      twitter: /twitter\.com\/[^\/\s]+/i,
      linkedin: /linkedin\.com\/[^\/\s]+/i,
      instagram: /instagram\.com\/[^\/\s]+/i
    };

    const links = {};

    $('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      Object.entries(socialPatterns).forEach(([platform, pattern]) => {
        if (pattern.test(href)) {
          links[platform] = href;
        }
      });
    });

    return links;
  }

  extractBusinessDescription($) {
    // Extract meta description first
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc && metaDesc.trim().length > 20) {
      return metaDesc.trim().slice(0, 300);
    }

    // Extract from common business description sections
    const descriptionSelectors = [
      '.about-us', '.business-description', '.company-description',
      '#about', '#about-us', '.intro', '.hero-text'
    ];

    for (const selector of descriptionSelectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 20) {
        return text.slice(0, 300);
      }
    }

    return null;
  }

  getRemainingRequests() {
    return Math.max(0, this.monthlyLimit - this.requestCount);
  }
}

module.exports = ScrapingdogClient;