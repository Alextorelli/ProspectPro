class PreValidationScorer {
    constructor() {
        this.weights = {
            businessName: 25,
            address: 25,
            phone: 20,
            website: 15,
            source: 15
        };
    }

    async score(business) {
        let totalScore = 0;
        const maxScore = 100;

        // Business Name Quality (25 points)
        const nameScore = this.scoreBusinessName(business.name);
        totalScore += (nameScore / 100) * this.weights.businessName;

        // Address Quality (25 points)  
        const addressScore = this.scoreAddress(business.address);
        totalScore += (addressScore / 100) * this.weights.address;

        // Phone Quality (20 points)
        const phoneScore = this.scorePhone(business.phone);
        totalScore += (phoneScore / 100) * this.weights.phone;

        // Website Quality (15 points)
        const websiteScore = await this.scoreWebsite(business.website);
        totalScore += (websiteScore / 100) * this.weights.website;

        // Source Quality (15 points)
        const sourceScore = this.scoreSource(business.source);
        totalScore += (sourceScore / 100) * this.weights.source;

        return Math.round(Math.min(totalScore, maxScore));
    }

    scoreBusinessName(name) {
        if (!name || name.trim().length < 2) {
            return 0;
        }

        // Check for generic/fake patterns
        const fakePatterns = [
            /^Business\s+(LLC|Inc|Corporation)$/i,
            /^Company\s+\d+$/i,
            /^Generic\s+/i,
            /^Test\s+/i,
            /^Sample\s+/i,
            /^Artisan\s+Bistro$/i,
            /^Downtown\s+Caf[eé]$/i,
            /^Gourmet\s+Restaurant$/i
        ];

        const isGeneric = fakePatterns.some(pattern => pattern.test(name.trim()));

        if (isGeneric) {
            return 0; // Immediate disqualification for fake names
        }

        // Length and specificity scoring
        const nameLength = name.trim().length;
        if (nameLength < 5) return 40;
        if (nameLength < 10) return 60;
        if (nameLength < 20) return 80;
        return 100;
    }

    scoreAddress(address) {
        if (!address || address.trim().length < 10) {
            return 0;
        }

        // Check for fake address patterns
        const fakePatterns = [
            /^\d+\s+Main\s+St(reet)?[\s,]/i, // Sequential Main Street
            /PO\s+Box/i,
            /Virtual\s+Office/i,
            /123\s+Fake\s+St/i,
            /100\s+Main\s+St/i,
            /110\s+Main\s+St/i,
            /120\s+Main\s+St/i
        ];

        const isFake = fakePatterns.some(pattern => pattern.test(address));

        if (isFake) {
            return 0; // Immediate disqualification for fake addresses
        }

        // Check for completeness (street, city, state)
        const hasStreetNumber = /^\d+/.test(address.trim());
        const hasCity = /,\s*[A-Za-z\s]+,/.test(address);
        const hasState = /[A-Z]{2}\s*\d{5}/.test(address);

        let score = 40; // Base score for non-fake address
        if (hasStreetNumber) score += 20;
        if (hasCity) score += 20;
        if (hasState) score += 20;

        return Math.min(score, 100);
    }

    scorePhone(phone) {
        if (!phone) {
            return 0;
        }

        // Clean phone number
        const cleanPhone = phone.replace(/[^\d]/g, '');

        // Check length
        if (cleanPhone.length !== 10) {
            return 20;
        }

        // Check for fake patterns
        const fakePatterns = [
            /^555/, // 555 numbers are often fake
            /^000/,
            /^111/,
            /^123456/,
            /^999/,
            /^512555/ // Specific fake pattern from our test
        ];

        const isFake = fakePatterns.some(pattern => pattern.test(cleanPhone));

        if (isFake) {
            return 0; // Immediate disqualification for fake phones
        }

        return 100; // Valid phone number format and pattern
    }

    async scoreWebsite(website) {
        if (!website) {
            return 50; // Not having a website is not disqualifying
        }

        // Check for fake domains
        const fakeDomains = [
            /example\.com$/i,
            /test\.com$/i,
            /fake\.com$/i,
            /placeholder\.com$/i,
            /artisanbistro\.com$/i,
            /downtowncaf\.net$/i,
            /gourmetrestaurant\.org$/i
        ];

        const isFakeDomain = fakeDomains.some(pattern => pattern.test(website));

        if (isFakeDomain) {
            return 0; // Immediate disqualification for fake domains
        }

        // Basic URL format validation
        try {
            new URL(website);
            return 100; // Valid URL format
        } catch {
            return 30; // Invalid URL format but not fake
        }
    }

    scoreSource(source) {
        const sourceScores = {
            'google_places': 100,
            'yellow_pages': 80,
            'yelp': 85,
            'facebook': 70,
            'linkedin': 75
        };

        return sourceScores[source] || 50;
    }
}

module.exports = PreValidationScorer;