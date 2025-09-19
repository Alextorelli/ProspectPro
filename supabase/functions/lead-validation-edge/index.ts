// ProspectPro Lead Validation Edge Function
// Multi-source validation for business leads (websites, emails, phones)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface ValidationRequest {
  leads: BusinessLead[];
  skipEmailValidation?: boolean;
  skipWebsiteCheck?: boolean;
}

interface BusinessLead {
  id: string;
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  address: string;
}

interface ValidationResult {
  id: string;
  name: string;
  validation: {
    website: {
      isValid: boolean;
      statusCode?: number;
      accessible: boolean;
      error?: string;
    };
    email: {
      isValid: boolean;
      deliverable: boolean;
      confidence: number;
      provider?: string;
      error?: string;
    };
    phone: {
      isValid: boolean;
      format: string;
      error?: string;
    };
  };
  overallScore: number;
  qualified: boolean;
  timestamp: string;
}

console.log("ProspectPro Lead Validation Edge Function loaded");

// Website validation function
async function validateWebsite(url: string): Promise<any> {
  if (!url) {
    return { isValid: false, accessible: false, error: "No website provided" };
  }

  try {
    // Ensure URL has protocol
    const websiteUrl = url.startsWith("http") ? url : `https://${url}`;

    const response = await fetch(websiteUrl, {
      method: "HEAD",
      headers: { "User-Agent": "ProspectPro-Validator/1.0" },
    });

    return {
      isValid: true,
      statusCode: response.status,
      accessible: response.status >= 200 && response.status < 400,
      error: null,
    };
  } catch (error) {
    return {
      isValid: false,
      accessible: false,
      error: (error as Error).message,
    };
  }
}

// Email validation function (basic format + domain check)
async function validateEmail(email: string): Promise<any> {
  if (!email) {
    return {
      isValid: false,
      deliverable: false,
      confidence: 0,
      error: "No email provided",
    };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      deliverable: false,
      confidence: 0,
      error: "Invalid email format",
    };
  }

  try {
    // Extract domain for basic validation
    const domain = email.split("@")[1];
    const provider = domain.toLowerCase();

    // Basic domain accessibility check
    const response = await fetch(`https://${domain}`, { method: "HEAD" });
    const accessible = response.status >= 200 && response.status < 400;

    return {
      isValid: true,
      deliverable: accessible,
      confidence: accessible ? 85 : 60,
      provider,
      error: null,
    };
  } catch (error) {
    return {
      isValid: true, // Format is valid even if domain check fails
      deliverable: false,
      confidence: 40,
      error: `Domain check failed: ${(error as Error).message}`,
    };
  }
}

// Phone validation function
function validatePhone(phone: string): any {
  if (!phone) {
    return { isValid: false, format: "none", error: "No phone provided" };
  }

  // Clean phone number
  const cleaned = phone.replace(/\D/g, "");

  // US phone number validation (10 digits)
  if (cleaned.length === 10) {
    const formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${
      cleaned.slice(6)
    }`;
    return { isValid: true, format: formatted, error: null };
  }

  // US phone with country code (11 digits starting with 1)
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    const number = cleaned.slice(1);
    const formatted = `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${
      number.slice(6)
    }`;
    return { isValid: true, format: formatted, error: null };
  }

  return { isValid: false, format: "invalid", error: "Invalid phone format" };
}

// Calculate overall lead score
function calculateLeadScore(validation: any): number {
  let score = 0;
  let maxScore = 0;

  // Website validation (40% weight)
  maxScore += 40;
  if (validation.website.accessible) score += 40;
  else if (validation.website.isValid) score += 20;

  // Email validation (35% weight)
  maxScore += 35;
  if (validation.email.deliverable) score += 35;
  else if (validation.email.isValid) score += 20;

  // Phone validation (25% weight)
  maxScore += 25;
  if (validation.phone.isValid) score += 25;

  return Math.round((score / maxScore) * 100);
}

Deno.serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers":
          "apikey, X-Client-Info, Content-Type, Authorization",
      },
    });
  }

  try {
    const { leads, skipEmailValidation = false, skipWebsiteCheck = false }:
      ValidationRequest = await req.json();

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid leads array" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    console.log(`Validating ${leads.length} business leads`);

    // Process leads in parallel for better performance
    const validationResults: ValidationResult[] = await Promise.all(
      leads.map(async (lead) => {
        const [websiteValidation, emailValidation, phoneValidation] =
          await Promise.all([
            skipWebsiteCheck
              ? { isValid: false, accessible: false, error: "Skipped" }
              : validateWebsite(lead.website || ""),
            skipEmailValidation
              ? {
                isValid: false,
                deliverable: false,
                confidence: 0,
                error: "Skipped",
              }
              : validateEmail(lead.email || ""),
            validatePhone(lead.phone || ""),
          ]);

        const validation = {
          website: websiteValidation,
          email: emailValidation,
          phone: phoneValidation,
        };

        const overallScore = calculateLeadScore(validation);

        return {
          id: lead.id,
          name: lead.name,
          validation,
          overallScore,
          qualified: overallScore >= 70, // 70% threshold for qualification
          timestamp: new Date().toISOString(),
        };
      }),
    );

    const qualifiedCount = validationResults.filter((result) =>
      result.qualified
    ).length;

    const response = {
      totalLeads: leads.length,
      validatedLeads: validationResults.length,
      qualifiedLeads: qualifiedCount,
      qualificationRate: Math.round((qualifiedCount / leads.length) * 100),
      results: validationResults,
      processing: {
        websiteChecks: skipWebsiteCheck ? 0 : leads.length,
        emailChecks: skipEmailValidation ? 0 : leads.length,
        phoneChecks: leads.length,
      },
      timestamp: new Date().toISOString(),
    };

    console.log(
      `Validation complete: ${qualifiedCount}/${leads.length} leads qualified (${response.qualificationRate}%)`,
    );

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Lead validation error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: (error as Error).message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});

/* To test locally:

  curl -X POST 'http://127.0.0.1:54321/functions/v1/lead-validation-edge' \
    --header 'Content-Type: application/json' \
    --data '{
      "leads": [
        {
          "id": "1",
          "name": "Test Restaurant",
          "website": "https://example.com",
          "email": "info@example.com",
          "phone": "(555) 123-4567",
          "address": "123 Main St, San Francisco, CA"
        }
      ]
    }'

*/
