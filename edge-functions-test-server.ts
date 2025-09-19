// Multi-function Edge Function test server
// Handles both business discovery and lead validation

const PORT = 8080;

// Business Discovery Mock Data
const mockBusinessData = {
  "restaurants in San Francisco, CA": [
    {
      name: "The French Laundry",
      formatted_address: "6640 Washington St, Yountville, CA 94599",
      rating: 4.6,
      user_ratings_total: 2847,
      place_id: "ChIJw7MZuQR-hYARt6E8nM-kW8g",
      website: "https://www.thomaskeller.com/tfl"
    },
    {
      name: "Atelier Crenn", 
      formatted_address: "3127 Fillmore St, San Francisco, CA 94123",
      rating: 4.4,
      user_ratings_total: 1203,
      place_id: "ChIJ8QjMKqeFhYARtE8nM-kB9fg",
      website: "https://www.ateliercrenn.com/"
    }
  ]
};

// Business Discovery Handler
async function handleBusinessDiscovery(request: any) {
  const { query, location, radius = 5000, maxResults = 20 } = request;
  
  if (!query || !location) {
    throw new Error('Missing required fields: query and location');
  }

  const searchQuery = `${query} in ${location}`;
  console.log(`🔍 Processing business discovery: ${searchQuery}`);

  const mockResults = mockBusinessData[searchQuery as keyof typeof mockBusinessData] || [];
  
  const businesses = mockResults.map((place: any) => {
    let confidence = 60;
    if (place.rating && place.rating >= 4.0) confidence += 15;
    if (place.user_ratings_total && place.user_ratings_total >= 10) confidence += 10;
    if (place.formatted_address) confidence += 10;
    if (place.website) confidence += 5;
    
    return {
      name: place.name,
      address: place.formatted_address || '',
      website: place.website || undefined,
      rating: place.rating || undefined,
      placeId: place.place_id,
      confidence: Math.min(confidence, 100)
    };
  }).filter((business: any) => business.confidence >= 70);

  return {
    query: searchQuery,
    location,
    radius,
    totalFound: mockResults.length,
    qualifiedResults: businesses.length,
    businesses,
    timestamp: new Date().toISOString(),
    apiCallsMade: 1,
    estimatedCost: 0.032,
    note: "Using mock data for development testing"
  };
}

// Lead Validation Handler
async function handleLeadValidation(request: any) {
  const { leads, skipEmailValidation = false, skipWebsiteCheck = false } = request;
  
  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    throw new Error('Missing or invalid leads array');
  }

  console.log(`🔍 Processing lead validation: ${leads.length} leads`);

  // Validate each lead
  const validationResults = await Promise.all(
    leads.map(async (lead: any) => {
      // Website validation
      let websiteValidation = { isValid: false, accessible: false, error: 'Skipped' };
      if (!skipWebsiteCheck && lead.website) {
        try {
          const url = lead.website.startsWith('http') ? lead.website : `https://${lead.website}`;
          // Mock validation - assume common domains are valid
          const isValid = ['google.com', 'example.com', 'github.com', 'microsoft.com'].some(domain => 
            url.toLowerCase().includes(domain)
          );
          websiteValidation = {
            isValid: true,
            accessible: isValid,
            statusCode: isValid ? 200 : 404,
            error: null
          };
        } catch (error) {
          websiteValidation = {
            isValid: false,
            accessible: false,
            error: (error as Error).message
          };
        }
      }

      // Email validation
      let emailValidation = { isValid: false, deliverable: false, confidence: 0, error: 'Skipped' };
      if (!skipEmailValidation && lead.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidFormat = emailRegex.test(lead.email);
        const domain = lead.email.split('@')[1]?.toLowerCase() || '';
        const isCommonProvider = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'].includes(domain);
        
        emailValidation = {
          isValid: isValidFormat,
          deliverable: isValidFormat && isCommonProvider,
          confidence: isValidFormat ? (isCommonProvider ? 85 : 60) : 0,
          provider: domain,
          error: isValidFormat ? null : 'Invalid email format'
        };
      }

      // Phone validation
      const phoneValidation = (() => {
        if (!lead.phone) return { isValid: false, format: 'none', error: 'No phone provided' };
        
        const cleaned = lead.phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
          return { 
            isValid: true, 
            format: `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`,
            error: null 
          };
        }
        return { isValid: false, format: 'invalid', error: 'Invalid phone format' };
      })();

      // Calculate overall score
      let score = 0;
      let maxScore = 0;
      
      maxScore += 40; // Website weight
      if (websiteValidation.accessible) score += 40;
      else if (websiteValidation.isValid) score += 20;
      
      maxScore += 35; // Email weight
      if (emailValidation.deliverable) score += 35;
      else if (emailValidation.isValid) score += 20;
      
      maxScore += 25; // Phone weight
      if (phoneValidation.isValid) score += 25;
      
      const overallScore = Math.round((score / maxScore) * 100);

      return {
        id: lead.id,
        name: lead.name,
        validation: {
          website: websiteValidation,
          email: emailValidation,
          phone: phoneValidation
        },
        overallScore,
        qualified: overallScore >= 70,
        timestamp: new Date().toISOString()
      };
    })
  );

  const qualifiedCount = validationResults.filter(result => result.qualified).length;

  return {
    totalLeads: leads.length,
    validatedLeads: validationResults.length,
    qualifiedLeads: qualifiedCount,
    qualificationRate: Math.round((qualifiedCount / leads.length) * 100),
    results: validationResults,
    processing: {
      websiteChecks: skipWebsiteCheck ? 0 : leads.length,
      emailChecks: skipEmailValidation ? 0 : leads.length,
      phoneChecks: leads.length
    },
    timestamp: new Date().toISOString()
  };
}

// Main server handler
Deno.serve({ port: PORT }, async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers }
      );
    }

    const requestBody = await req.json();
    let response;

    if (path === '/business-discovery') {
      response = await handleBusinessDiscovery(requestBody);
    } else if (path === '/lead-validation') {
      response = await handleLeadValidation(requestBody);
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Unknown endpoint',
          availableEndpoints: ['/business-discovery', '/lead-validation']
        }),
        { status: 404, headers }
      );
    }

    return new Response(JSON.stringify(response, null, 2), { headers });
    
  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers }
    );
  }
});

console.log(`🚀 ProspectPro Edge Functions Test Server running on http://localhost:${PORT}`);
console.log(`📡 Available endpoints:`);
console.log(`   POST http://localhost:${PORT}/business-discovery`);
console.log(`   POST http://localhost:${PORT}/lead-validation`);
console.log(`🧪 Run tests with: deno run --allow-net test-edge-functions-suite.ts`);