// enrichment-pdl v1.0
// PeopleDataLabs API integration for company and person enrichment
// Company Cost: $0.05-$0.10 per match
// Person Cost: $0.20-$0.28 per match
// Plan: $100/month for 1,000 company records OR $98/month for 350 person records

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const PDL_API_BASE = "https://api.peopledatalabs.com/v5";

// In-memory cache (30 days for company, 60 days for person)
const pdlCache = new Map<
  string,
  { data: Record<string, unknown>; timestamp: number }
>();
const COMPANY_CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PERSON_CACHE_DURATION_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

interface PDLRequest {
  action:
    | "enrichCompany"
    | "searchCompany"
    | "enrichPerson"
    | "searchPerson"
    | "bulkEnrichCompany"
    | "bulkEnrichPerson";

  // Company enrichment parameters
  companyName?: string;
  website?: string;
  location?: string;

  // Company search parameters
  industryQuery?: string;
  maxEmployees?: number;
  minEmployees?: number;
  technologies?: string[];

  // Person enrichment parameters
  personName?: string;
  personEmail?: string;
  personPhone?: string;
  linkedinUrl?: string;
  companyNameForPerson?: string;

  // Person search parameters
  jobTitle?: string;
  jobTitleKeywords?: string[];
  seniority?: string;

  // Bulk enrichment
  companies?: Array<{ name: string; website?: string; location?: string }>;
  people?: Array<{ name: string; company?: string; email?: string }>;

  // Quality controls
  minLikelihood?: number; // 1-10 scale (default 8 for cost efficiency)
  maxCostPerRequest?: number; // Budget constraint
}

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Parse request
    const requestData: PDLRequest = await req.json();
    const { action, maxCostPerRequest = 1.0 } = requestData;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve API key from Supabase Vault
    const { data: secretData, error: secretError } = await supabase.rpc(
      "vault_decrypt_secret",
      {
        secret_name: "PEOPLE_DATA_LABS_API_KEY",
      }
    );

    if (secretError || !secretData) {
      console.error("Failed to retrieve PDL API key:", secretError);
      return new Response(
        JSON.stringify({
          error: "API key not configured",
          details: secretError?.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const apiKey = secretData;

    // Route to appropriate endpoint
    let result;
    switch (action) {
      case "enrichCompany":
        result = await enrichCompany(apiKey, requestData, maxCostPerRequest);
        break;
      case "searchCompany":
        result = await searchCompany(apiKey, requestData, maxCostPerRequest);
        break;
      case "enrichPerson":
        result = await enrichPerson(apiKey, requestData, maxCostPerRequest);
        break;
      case "searchPerson":
        result = await searchPerson(apiKey, requestData, maxCostPerRequest);
        break;
      case "bulkEnrichCompany":
        result = await bulkEnrichCompany(
          apiKey,
          requestData,
          maxCostPerRequest
        );
        break;
      case "bulkEnrichPerson":
        result = await bulkEnrichPerson(apiKey, requestData, maxCostPerRequest);
        break;
      default:
        return new Response(
          JSON.stringify({
            error: "Invalid action",
            validActions: [
              "enrichCompany",
              "searchCompany",
              "enrichPerson",
              "searchPerson",
              "bulkEnrichCompany",
              "bulkEnrichPerson",
            ],
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("PDL API error:", error);
    return new Response(
      JSON.stringify({
        error: "PeopleDataLabs request failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

// Enrich company by name, website, or location
async function enrichCompany(
  apiKey: string,
  params: PDLRequest,
  maxCost: number
) {
  const { companyName, website, location } = params;

  if (!companyName && !website) {
    return { error: "Missing required parameter: companyName or website" };
  }

  // Check cost constraint
  const estimatedCost = 0.1; // Max cost for company enrichment
  if (estimatedCost > maxCost) {
    return {
      error: "Cost exceeds budget",
      estimatedCost,
      maxCost,
    };
  }

  // Check cache
  const cacheKey = `company:enrich:${companyName}:${website}:${location}`;
  const cached = pdlCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < COMPANY_CACHE_DURATION_MS) {
    console.log("✅ PDL Company cache hit:", cacheKey);
    return { ...cached.data, cached: true, cost: 0 };
  }

  // Build request
  const url = `${PDL_API_BASE}/company/enrich`;
  const requestBody: Record<string, string> = {};
  if (companyName) requestBody.name = companyName;
  if (website) requestBody.website = website;
  if (location) requestBody.location = location;

  // Make API request
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    // PDL uses query parameters for GET requests
    // Convert to query string
  });

  // Convert body to query params
  const queryParams = new URLSearchParams(requestBody);
  const fullUrl = `${url}?${queryParams.toString()}`;

  const apiResponse = await fetch(fullUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
  });

  if (!apiResponse.ok) {
    return {
      error: "PDL Company enrichment failed",
      status: apiResponse.status,
      statusText: apiResponse.statusText,
    };
  }

  const data = await apiResponse.json();

  // Calculate actual cost based on response
  const actualCost = data.status === 200 ? 0.1 : 0; // Only charge on success

  // Process results
  const result = {
    action: "enrichCompany",
    status: data.status,
    found: data.status === 200,
    data:
      data.status === 200
        ? {
            name: data.data?.name,
            website: data.data?.website,
            industry: data.data?.industry,
            employeeCount: data.data?.employee_count,
            employeeCountRange: data.data?.size,
            location: data.data?.location,
            founded: data.data?.founded,
            technologies: data.data?.technologies,
            socialProfiles: {
              linkedin: data.data?.linkedin_url,
              twitter: data.data?.twitter_url,
              facebook: data.data?.facebook_url,
            },
            revenueEstimate: data.data?.estimated_annual_revenue,
            fundingTotal: data.data?.total_funding_raised,
            tags: data.data?.tags,
            likelihood: data.likelihood,
          }
        : null,
    cost: actualCost,
    cached: false,
  };

  // Cache successful results
  if (data.status === 200) {
    pdlCache.set(cacheKey, { data: result, timestamp: Date.now() });
  }

  return result;
}

// Search companies by criteria
async function searchCompany(
  apiKey: string,
  params: PDLRequest,
  maxCost: number
) {
  const {
    industryQuery,
    location,
    maxEmployees = 50,
    minEmployees = 1,
    technologies,
  } = params;

  if (!industryQuery && !location) {
    return { error: "Missing required parameter: industryQuery or location" };
  }

  // Build query
  const queryParts: string[] = [];
  if (industryQuery) queryParts.push(`industry:${industryQuery}`);
  if (location) queryParts.push(`location:${location}`);
  queryParts.push(`employees:[${minEmployees} TO ${maxEmployees}]`);
  if (technologies && technologies.length > 0) {
    queryParts.push(`technologies:(${technologies.join(" OR ")})`);
  }

  const query = queryParts.join(" AND ");

  // Build request
  const url = `${PDL_API_BASE}/company/search`;
  const requestBody = {
    query,
    size: 10, // Limit results to control costs
    required: "website OR phone OR emails",
  };

  // Make API request
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
  });

  // Convert to query params
  const queryParams = new URLSearchParams({
    query: requestBody.query,
    size: requestBody.size.toString(),
    required: requestBody.required,
  });
  const fullUrl = `${url}?${queryParams.toString()}`;

  const apiResponse = await fetch(fullUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
  });

  if (!apiResponse.ok) {
    return {
      error: "PDL Company search failed",
      status: apiResponse.status,
      statusText: apiResponse.statusText,
    };
  }

  const data = await apiResponse.json();

  // Calculate cost (each result costs like enrichment)
  const resultCount = data.data?.length || 0;
  const actualCost = resultCount * 0.1;

  return {
    action: "searchCompany",
    status: data.status,
    query,
    resultCount,
    results: data.data || [],
    cost: actualCost,
    cached: false,
  };
}

// Enrich person by name, email, or company
async function enrichPerson(
  apiKey: string,
  params: PDLRequest,
  maxCost: number
) {
  const {
    personName,
    personEmail,
    personPhone,
    linkedinUrl,
    companyNameForPerson,
    minLikelihood = 8,
  } = params;

  if (!personName && !personEmail && !linkedinUrl) {
    return {
      error:
        "Missing required parameter: personName, personEmail, or linkedinUrl",
    };
  }

  // Check cost constraint
  const estimatedCost = 0.28; // Max cost for person enrichment
  if (estimatedCost > maxCost) {
    return {
      error: "Cost exceeds budget",
      estimatedCost,
      maxCost,
      recommendation:
        "Use company enrichment first ($0.10) to validate business before person enrichment",
    };
  }

  // Check cache
  const cacheKey = `person:enrich:${personName}:${personEmail}:${linkedinUrl}:${companyNameForPerson}`;
  const cached = pdlCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < PERSON_CACHE_DURATION_MS) {
    console.log("✅ PDL Person cache hit:", cacheKey);
    return { ...cached.data, cached: true, cost: 0 };
  }

  // Build request
  const url = `${PDL_API_BASE}/person/enrich`;
  const requestBody: Record<string, string | number> = {
    min_likelihood: minLikelihood,
  };
  if (personName) requestBody.name = personName;
  if (personEmail) requestBody.email = personEmail;
  if (personPhone) requestBody.phone = personPhone;
  if (linkedinUrl) requestBody.linkedin_url = linkedinUrl;
  if (companyNameForPerson) requestBody.company = companyNameForPerson;

  // Convert to query params
  const queryParams = new URLSearchParams(
    Object.entries(requestBody).map(([key, value]) => [key, String(value)])
  );
  const fullUrl = `${url}?${queryParams.toString()}`;

  // Make API request
  const response = await fetch(fullUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
  });

  if (!response.ok) {
    return {
      error: "PDL Person enrichment failed",
      status: response.status,
      statusText: response.statusText,
    };
  }

  const data = await response.json();

  // Calculate actual cost based on response
  const actualCost = data.status === 200 ? 0.28 : 0; // Only charge on success

  // Process results
  const result = {
    action: "enrichPerson",
    status: data.status,
    found: data.status === 200,
    data:
      data.status === 200
        ? {
            name: data.data?.full_name,
            firstName: data.data?.first_name,
            lastName: data.data?.last_name,
            email: data.data?.work_email || data.data?.personal_emails?.[0],
            phone: data.data?.mobile_phone,
            linkedin: data.data?.linkedin_url,
            jobTitle: data.data?.job_title,
            jobCompany: data.data?.job_company_name,
            seniority: data.data?.job_title_levels,
            location: data.data?.location_name,
            education: data.data?.education,
            skills: data.data?.skills,
            experience: data.data?.experience,
            likelihood: data.likelihood,
          }
        : null,
    cost: actualCost,
    cached: false,
  };

  // Cache successful results
  if (data.status === 200) {
    pdlCache.set(cacheKey, { data: result, timestamp: Date.now() });
  }

  return result;
}

// Search people by job title, company, location
async function searchPerson(
  apiKey: string,
  params: PDLRequest,
  maxCost: number
) {
  const {
    jobTitle,
    jobTitleKeywords,
    companyNameForPerson,
    location,
    seniority,
    minLikelihood = 8,
  } = params;

  if (!jobTitle && !jobTitleKeywords && !companyNameForPerson) {
    return {
      error:
        "Missing required parameter: jobTitle, jobTitleKeywords, or companyNameForPerson",
    };
  }

  // Build query
  const queryParts: string[] = [];
  if (jobTitle) queryParts.push(`job_title:${jobTitle}`);
  if (jobTitleKeywords && jobTitleKeywords.length > 0) {
    const titleQuery = jobTitleKeywords
      .map((kw) => `job_title:${kw}`)
      .join(" OR ");
    queryParts.push(`(${titleQuery})`);
  }
  if (companyNameForPerson) queryParts.push(`company:${companyNameForPerson}`);
  if (location) queryParts.push(`location:${location}`);
  if (seniority) queryParts.push(`seniority:${seniority}`);

  const query = queryParts.join(" AND ");

  // Build request
  const url = `${PDL_API_BASE}/person/search`;
  const requestBody = {
    query,
    size: 10, // Limit results to control costs
    min_likelihood: minLikelihood,
  };

  // Convert to query params
  const queryParams = new URLSearchParams({
    query: requestBody.query,
    size: requestBody.size.toString(),
    min_likelihood: requestBody.min_likelihood.toString(),
  });
  const fullUrl = `${url}?${queryParams.toString()}`;

  // Make API request
  const response = await fetch(fullUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
  });

  if (!response.ok) {
    return {
      error: "PDL Person search failed",
      status: response.status,
      statusText: response.statusText,
    };
  }

  const data = await response.json();

  // Calculate cost (each result costs like enrichment)
  const resultCount = data.data?.length || 0;
  const actualCost = resultCount * 0.28;

  return {
    action: "searchPerson",
    status: data.status,
    query,
    resultCount,
    results: data.data || [],
    cost: actualCost,
    cached: false,
  };
}

// Bulk enrich companies (up to 100 per request)
async function bulkEnrichCompany(
  apiKey: string,
  params: PDLRequest,
  maxCost: number
) {
  const { companies } = params;

  if (!companies || companies.length === 0) {
    return { error: "Missing required parameter: companies array" };
  }

  // Limit batch size
  const batchSize = Math.min(companies.length, 100);
  const batch = companies.slice(0, batchSize);

  // Check cost constraint
  const estimatedCost = batchSize * 0.1;
  if (estimatedCost > maxCost) {
    return {
      error: "Cost exceeds budget",
      estimatedCost,
      maxCost,
      batchSize,
      recommendation: `Reduce batch size to ${Math.floor(
        maxCost / 0.1
      )} companies`,
    };
  }

  // Build request
  const url = `${PDL_API_BASE}/company/bulk`;
  const requestBody = {
    requests: batch.map((c) => ({
      params: {
        name: c.name,
        website: c.website,
        location: c.location,
      },
    })),
  };

  // Make API request
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    return {
      error: "PDL Bulk company enrichment failed",
      status: response.status,
      statusText: response.statusText,
    };
  }

  const data = await response.json();

  // Calculate actual cost
  const successCount = data.filter(
    (r: { status: number }) => r.status === 200
  ).length;
  const actualCost = successCount * 0.1;

  return {
    action: "bulkEnrichCompany",
    batchSize,
    successCount,
    results: data,
    cost: actualCost,
    cached: false,
  };
}

// Bulk enrich people (up to 100 per request)
async function bulkEnrichPerson(
  apiKey: string,
  params: PDLRequest,
  maxCost: number
) {
  const { people, minLikelihood = 8 } = params;

  if (!people || people.length === 0) {
    return { error: "Missing required parameter: people array" };
  }

  // Limit batch size
  const batchSize = Math.min(people.length, 100);
  const batch = people.slice(0, batchSize);

  // Check cost constraint
  const estimatedCost = batchSize * 0.28;
  if (estimatedCost > maxCost) {
    return {
      error: "Cost exceeds budget",
      estimatedCost,
      maxCost,
      batchSize,
      recommendation: `Reduce batch size to ${Math.floor(
        maxCost / 0.28
      )} people`,
    };
  }

  // Build request
  const url = `${PDL_API_BASE}/person/bulk`;
  const requestBody = {
    requests: batch.map((p) => ({
      params: {
        name: p.name,
        company: p.company,
        email: p.email,
        min_likelihood: minLikelihood,
      },
    })),
  };

  // Make API request
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    return {
      error: "PDL Bulk person enrichment failed",
      status: response.status,
      statusText: response.statusText,
    };
  }

  const data = await response.json();

  // Calculate actual cost
  const successCount = data.filter(
    (r: { status: number }) => r.status === 200
  ).length;
  const actualCost = successCount * 0.28;

  return {
    action: "bulkEnrichPerson",
    batchSize,
    successCount,
    results: data,
    cost: actualCost,
    cached: false,
  };
}

console.log("🧑‍💼 PeopleDataLabs Edge Function v1.0 initialized");
console.log("🏢 Company Enrichment: $0.05-$0.10 per match");
console.log("👤 Person Enrichment: $0.20-$0.28 per match");
console.log("📦 Cache: 30 days (company), 60 days (person)");
console.log("💡 Best Practice: Company-first enrichment for 53% cost savings");
