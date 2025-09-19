// Business Categories for Google Places API Integration
// Aligned with Google Places business types for optimal search results

const BUSINESS_CATEGORIES = {
    'Professional Services': {
        name: 'Professional Services',
        description: 'Business-to-business and professional services',
        types: [
            'accounting',
            'lawyer',
            'consultant',
            'real estate agency',
            'insurance agency',
            'corporate office'
        ]
    },
    'Health & Medical Services': {
        name: 'Health & Medical Services', 
        description: 'Healthcare and medical service providers',
        types: [
            'doctor',
            'dentist',
            'hospital',
            'pharmacy',
            'drugstore',
            'chiropractor',
            'physiotherapist',
            'dental clinic',
            'medical lab',
            'veterinary care',
            'wellness center',
            'skin care clinic'
        ]
    },
    'Personal Care & Beauty': {
        name: 'Personal Care & Beauty',
        description: 'Personal grooming and beauty services',
        types: [
            'hair salon',
            'hair care',
            'beauty salon',
            'barber shop',
            'nail salon',
            'spa',
            'massage',
            'beautician',
            'makeup artist',
            'body art service',
            'tanning studio',
            'sauna'
        ]
    },
    'Home & Property Services': {
        name: 'Home & Property Services',
        description: 'Construction, maintenance, and property services',
        types: [
            'electrician',
            'plumber',
            'painter',
            'roofing contractor',
            'general contractor',
            'locksmith',
            'moving company',
            'laundry',
            'storage',
            'catering service'
        ]
    },
    'Automotive Services': {
        name: 'Automotive Services',
        description: 'Vehicle-related services and sales',
        types: [
            'car repair',
            'car wash',
            'car dealer',
            'car rental',
            'gas station',
            'electric vehicle charging station',
            'auto parts store'
        ]
    },
    'Food & Beverage': {
        name: 'Food & Beverage',
        description: 'Restaurants, cafes, and food services',
        types: [
            'restaurant',
            'cafe',
            'bakery',
            'bar',
            'fast food restaurant',
            'pizza restaurant',
            'chinese restaurant',
            'mexican restaurant',
            'italian restaurant',
            'japanese restaurant',
            'indian restaurant',
            'meal delivery',
            'meal takeaway',
            'catering service',
            'pub',
            'wine bar',
            'coffee shop',
            'ice cream shop',
            'food court'
        ]
    },
    'Retail & Commerce': {
        name: 'Retail & Commerce',
        description: 'Retail stores and commercial establishments',
        types: [
            'clothing store',
            'shoe store',
            'electronics store',
            'furniture store',
            'home goods store',
            'jewelry store',
            'book store',
            'gift shop',
            'department store',
            'shopping mall',
            'supermarket',
            'grocery store',
            'convenience store',
            'pet store',
            'sporting goods store',
            'bicycle store'
        ]
    },
    'Technology & Digital Services': {
        name: 'Technology & Digital Services',
        description: 'IT, technology, and digital services',
        types: [
            'electronics store',
            'cell phone store',
            'telecommunications service provider',
            'internet cafe'
        ]
    },
    'Education & Training': {
        name: 'Education & Training',
        description: 'Educational institutions and training services',
        types: [
            'school',
            'university',
            'primary school',
            'secondary school',
            'preschool',
            'library',
            'summer camp organizer'
        ]
    },
    'Event & Entertainment Services': {
        name: 'Event & Entertainment Services',
        description: 'Entertainment, events, and recreational services',
        types: [
            'event venue',
            'wedding venue',
            'banquet hall',
            'movie theater',
            'bowling alley',
            'amusement park',
            'casino',
            'night club',
            'tourist attraction',
            'museum',
            'zoo',
            'aquarium',
            'park'
        ]
    }
};

// Helper functions for the frontend
window.BusinessCategories = {
    getCategories: () => Object.keys(BUSINESS_CATEGORIES),
    
    getCategory: (categoryName) => BUSINESS_CATEGORIES[categoryName],
    
    // Helper function to capitalize words for display
    capitalizeWords: function(str) {
        return str.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    },
    
    getTypesForCategory: function(categoryName) {
        const category = BUSINESS_CATEGORIES[categoryName];
        if (category) {
            // Return capitalized versions for display
            return category.types.map(type => this.capitalizeWords(type));
        }
        return [];
    },
    
    // Get raw (uncapitalized) business type for API calls
    getRawTypeForDisplay: function(displayType) {
        return displayType.toLowerCase();
    },
    
    getCategoryForType: (businessType) => {
        for (const [categoryName, category] of Object.entries(BUSINESS_CATEGORIES)) {
            if (category.types.includes(businessType)) {
                return categoryName;
            }
        }
        return null;
    },
    
    getAllTypes: () => {
        return Object.values(BUSINESS_CATEGORIES)
            .flatMap(category => category.types);
    }
};