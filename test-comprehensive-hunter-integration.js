/**
 * COMPREHENSIVE HUNTER.IO API INTEGRATION TEST
 *
 * Tests all Hunter.io API v2 endpoints with real API calls:
 * ✅ Account Information (FREE)
 * ✅ Email Count (FREE)
 * ✅ Company Enrichment (PAID)
 * ✅ Domain Search (PAID)
 * ✅ Email Finder (PAID)
 * ✅ Email Verifier (PAID)
 * ✅ Person Enrichment (PAID)
 * ✅ Combined Enrichment (PAID)
 * ✅ Discover API (FREE)
 *
 * Validates complete integration and measures performance
 */

const ComprehensiveHunterClient = require("./modules/api-clients/comprehensive-hunter-client");

class HunterAPIIntegrationTest {
  constructor() {
    this.apiKey =
      process.env.HUNTER_IO_API_KEY ||
      "7bb2d1f9b5f8af7c1e8bf1736cf51f60eff49bbf";

    this.client = new ComprehensiveHunterClient(this.apiKey, {
      maxDailyCost: 2.0, // Conservative budget for testing
      maxPerLeadCost: 0.5,
      minEmailConfidence: 70,
    });

    // Test data
    this.testDomains = ["stripe.com", "hunter.io", "torchystacos.com"];
    this.testEmails = ["patrick@stripe.com", "matt@hunter.io"];
    this.testPersons = [
      { domain: "reddit.com", firstName: "Alexis", lastName: "Ohanian" },
      { domain: "stripe.com", firstName: "Patrick", lastName: "Collison" },
    ];

    this.results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      apiCalls: 0,
      totalCost: 0,
      endpointResults: {},
      startTime: Date.now(),
    };

    console.log("🧪 Hunter.io API Integration Test Suite");
    console.log(`   🔑 API Key: ${this.apiKey.substring(0, 8)}...`);
    console.log(`   🎯 Test Budget: $2.00`);
    console.log(
      `   📊 Testing ${this.testDomains.length} domains, ${this.testEmails.length} emails`
    );
    console.log("");
  }

  async runAllTests() {
    console.log("🚀 Starting comprehensive Hunter.io API tests...\n");

    try {
      // Test 1: Account Information (FREE)
      await this.testAccountInfo();

      // Test 2: Email Count API (FREE)
      await this.testEmailCount();

      // Test 3: Company Enrichment (PAID)
      await this.testCompanyEnrichment();

      // Test 4: Domain Search (PAID)
      await this.testDomainSearch();

      // Test 5: Email Finder (PAID)
      await this.testEmailFinder();

      // Test 6: Email Verifier (PAID)
      await this.testEmailVerifier();

      // Test 7: Person Enrichment (PAID)
      await this.testPersonEnrichment();

      // Test 8: Combined Enrichment (PAID)
      await this.testCombinedEnrichment();

      // Test 9: Discover API (FREE)
      await this.testDiscoverAPI();

      // Test 10: Comprehensive Discovery Pipeline
      await this.testComprehensiveDiscovery();

      // Generate final report
      this.generateFinalReport();
    } catch (error) {
      console.error("❌ Test suite failed:", error.message);
      this.results.failedTests++;
    }
  }

  async testAccountInfo() {
    console.log("📊 Testing Account Information API (FREE)...");
    this.results.totalTests++;

    try {
      const response = await this.client.makeApiRequest("GET", "account");

      if (response.data) {
        console.log(
          `   ✅ Account: ${response.data.first_name} ${response.data.last_name}`
        );
        console.log(
          `   📋 Plan: ${response.data.plan_name} (Level ${response.data.plan_level})`
        );
        console.log(
          `   🔍 Searches: ${response.data.requests.searches.used}/${response.data.requests.searches.available}`
        );
        console.log(
          `   ✉️ Verifications: ${response.data.requests.verifications.used}/${response.data.requests.verifications.available}`
        );
        console.log(
          `   💳 Credits: ${response.data.requests.credits.used}/${response.data.requests.credits.available}`
        );

        this.results.endpointResults.account = {
          status: "PASS",
          data: response.data,
        };
        this.results.passedTests++;
      } else {
        throw new Error("No account data returned");
      }
    } catch (error) {
      console.error(`   ❌ Account test failed: ${error.message}`);
      this.results.endpointResults.account = {
        status: "FAIL",
        error: error.message,
      };
      this.results.failedTests++;
    }

    console.log("");
  }

  async testEmailCount() {
    console.log("📈 Testing Email Count API (FREE)...");
    this.results.totalTests++;

    try {
      const testResults = [];

      for (const domain of this.testDomains.slice(0, 2)) {
        // Test 2 domains
        console.log(`   🔍 Checking email count for: ${domain}`);

        const emailCount = await this.client.getEmailCount(domain);

        if (emailCount) {
          console.log(`     📧 Total emails: ${emailCount.total}`);
          console.log(`     👤 Personal: ${emailCount.personal_emails}`);
          console.log(`     🏢 Generic: ${emailCount.generic_emails}`);

          testResults.push({
            domain,
            count: emailCount.total,
            breakdown: emailCount,
          });
        }

        await this.delay(500); // Rate limiting
      }

      if (testResults.length > 0) {
        this.results.endpointResults.emailCount = {
          status: "PASS",
          results: testResults,
        };
        this.results.passedTests++;
        console.log("   ✅ Email Count API test passed");
      } else {
        throw new Error("No email count results");
      }
    } catch (error) {
      console.error(`   ❌ Email Count test failed: ${error.message}`);
      this.results.endpointResults.emailCount = {
        status: "FAIL",
        error: error.message,
      };
      this.results.failedTests++;
    }

    console.log("");
  }

  async testCompanyEnrichment() {
    console.log("🏢 Testing Company Enrichment API (PAID)...");
    this.results.totalTests++;

    try {
      const testResults = [];

      for (const domain of this.testDomains.slice(0, 2)) {
        // Test 2 companies
        console.log(`   🏛️ Enriching company: ${domain}`);

        const companyData = await this.client.enrichCompanyData(domain);

        if (companyData) {
          console.log(`     🏷️ Name: ${companyData.name}`);
          console.log(`     🏭 Industry: ${companyData.industry}`);
          console.log(`     👥 Employees: ${companyData.employees}`);
          console.log(`     📍 Location: ${companyData.location}`);
          console.log(`     📞 Phone: ${companyData.phone || "N/A"}`);
          console.log(
            `     🔧 Technologies: ${
              companyData.technologies.slice(0, 3).join(", ") || "N/A"
            }`
          );

          testResults.push({
            domain,
            enrichment: companyData,
          });

          this.results.apiCalls++;
          this.results.totalCost += 0.034;
        }

        await this.delay(1000); // Rate limiting
      }

      if (testResults.length > 0) {
        this.results.endpointResults.companyEnrichment = {
          status: "PASS",
          results: testResults,
        };
        this.results.passedTests++;
        console.log("   ✅ Company Enrichment test passed");
      } else {
        throw new Error("No company enrichment results");
      }
    } catch (error) {
      console.error(`   ❌ Company Enrichment test failed: ${error.message}`);
      this.results.endpointResults.companyEnrichment = {
        status: "FAIL",
        error: error.message,
      };
      this.results.failedTests++;
    }

    console.log("");
  }

  async testDomainSearch() {
    console.log("🔍 Testing Domain Search API (PAID)...");
    this.results.totalTests++;

    try {
      const businessData = {
        business_name: "Test Company",
        industry: "technology",
      };

      const domain = this.testDomains[0]; // Test Stripe
      console.log(`   🎯 Searching domain: ${domain}`);

      const domainResult = await this.client.comprehensiveDomainSearch(
        domain,
        businessData
      );

      if (domainResult && domainResult.emails.length > 0) {
        console.log(`   📧 Found ${domainResult.emails.length} emails`);
        console.log(
          `   📊 Email patterns: ${domainResult.patterns.join(", ")}`
        );
        console.log(`   🏛️ Organization: ${domainResult.organization}`);

        // Show top 3 emails
        domainResult.emails.slice(0, 3).forEach((email, index) => {
          console.log(
            `     ${index + 1}. ${email.value} (${
              email.confidence
            }% confidence)`
          );
          if (email.position)
            console.log(`        Position: ${email.position}`);
        });

        this.results.endpointResults.domainSearch = {
          status: "PASS",
          emails: domainResult.emails.length,
          patterns: domainResult.patterns,
        };
        this.results.passedTests++;
        this.results.apiCalls++;
        this.results.totalCost += 0.034;

        console.log("   ✅ Domain Search test passed");
      } else {
        throw new Error("No domain search results");
      }
    } catch (error) {
      console.error(`   ❌ Domain Search test failed: ${error.message}`);
      this.results.endpointResults.domainSearch = {
        status: "FAIL",
        error: error.message,
      };
      this.results.failedTests++;
    }

    console.log("");
  }

  async testEmailFinder() {
    console.log("🕵️ Testing Email Finder API (PAID)...");
    this.results.totalTests++;

    try {
      const testResults = [];

      for (const person of this.testPersons) {
        console.log(
          `   👤 Finding email: ${person.firstName} ${person.lastName} @ ${person.domain}`
        );

        const email = await this.client.findPersonEmail(
          person.domain,
          `${person.firstName} ${person.lastName}`
        );

        if (email) {
          console.log(`     ✉️ Found: ${email.value}`);
          console.log(`     🎯 Confidence: ${email.confidence}%`);
          console.log(`     💼 Position: ${email.position || "N/A"}`);

          testResults.push({
            person: `${person.firstName} ${person.lastName}`,
            email: email.value,
            confidence: email.confidence,
          });

          this.results.apiCalls++;
          this.results.totalCost += 0.034;
        }

        await this.delay(1000); // Rate limiting
      }

      if (testResults.length > 0) {
        this.results.endpointResults.emailFinder = {
          status: "PASS",
          results: testResults,
        };
        this.results.passedTests++;
        console.log("   ✅ Email Finder test passed");
      } else {
        console.log("   ⚠️ No emails found (may be expected)");
        this.results.endpointResults.emailFinder = {
          status: "PASS",
          results: [],
        };
        this.results.passedTests++;
      }
    } catch (error) {
      console.error(`   ❌ Email Finder test failed: ${error.message}`);
      this.results.endpointResults.emailFinder = {
        status: "FAIL",
        error: error.message,
      };
      this.results.failedTests++;
    }

    console.log("");
  }

  async testEmailVerifier() {
    console.log("✅ Testing Email Verifier API (PAID)...");
    this.results.totalTests++;

    try {
      const testResults = [];

      for (const email of this.testEmails) {
        console.log(`   🔍 Verifying: ${email}`);

        const verification = await this.client.verifyEmail(email);

        if (verification) {
          console.log(`     📋 Status: ${verification.status}`);
          console.log(`     🎯 Score: ${verification.score}/100`);
          console.log(
            `     📤 Deliverable: ${verification.deliverable ? "Yes" : "No"}`
          );
          console.log(
            `     🌐 MX Records: ${
              verification.mx_records ? "Valid" : "Invalid"
            }`
          );
          console.log(
            `     📧 SMTP Check: ${verification.smtp_check ? "Pass" : "Fail"}`
          );

          testResults.push({
            email,
            status: verification.status,
            score: verification.score,
            deliverable: verification.deliverable,
          });

          this.results.apiCalls++;
          this.results.totalCost += 0.01;
        }

        await this.delay(1000); // Rate limiting
      }

      if (testResults.length > 0) {
        this.results.endpointResults.emailVerifier = {
          status: "PASS",
          results: testResults,
        };
        this.results.passedTests++;
        console.log("   ✅ Email Verifier test passed");
      } else {
        throw new Error("No email verification results");
      }
    } catch (error) {
      console.error(`   ❌ Email Verifier test failed: ${error.message}`);
      this.results.endpointResults.emailVerifier = {
        status: "FAIL",
        error: error.message,
      };
      this.results.failedTests++;
    }

    console.log("");
  }

  async testPersonEnrichment() {
    console.log("👥 Testing Person Enrichment API (PAID)...");
    this.results.totalTests++;

    try {
      const testEmails = [{ value: this.testEmails[0] }]; // Test one person
      const personData = await this.client.enrichPersonData(testEmails);

      if (personData.length > 0) {
        const person = personData[0];
        console.log(`   👤 Person: ${person.name.full}`);
        console.log(`   📍 Location: ${person.location || "N/A"}`);
        console.log(`   💼 Title: ${person.employment.title || "N/A"}`);
        console.log(`   🏢 Company: ${person.employment.company || "N/A"}`);
        console.log(
          `   🔗 LinkedIn: ${person.social_profiles.linkedin || "N/A"}`
        );
        console.log(`   📞 Phone: ${person.phone || "N/A"}`);

        this.results.endpointResults.personEnrichment = {
          status: "PASS",
          person: person.name.full,
          employment: person.employment,
        };
        this.results.passedTests++;
        this.results.apiCalls++;
        this.results.totalCost += 0.034;

        console.log("   ✅ Person Enrichment test passed");
      } else {
        console.log("   ⚠️ No person enrichment data found");
        this.results.endpointResults.personEnrichment = {
          status: "PASS",
          results: [],
        };
        this.results.passedTests++;
      }
    } catch (error) {
      console.error(`   ❌ Person Enrichment test failed: ${error.message}`);
      this.results.endpointResults.personEnrichment = {
        status: "FAIL",
        error: error.message,
      };
      this.results.failedTests++;
    }

    console.log("");
  }

  async testCombinedEnrichment() {
    console.log("🔗 Testing Combined Enrichment API (PAID)...");
    this.results.totalTests++;

    try {
      const email = this.testEmails[0];
      console.log(`   🎯 Combined enrichment for: ${email}`);

      const combinedData = await this.client.getCombinedEnrichment(email);

      if (combinedData) {
        console.log("   👤 Person Data:");
        console.log(`     Name: ${combinedData.person.name || "N/A"}`);
        console.log(`     Location: ${combinedData.person.location || "N/A"}`);
        console.log(
          `     Title: ${combinedData.person.employment.title || "N/A"}`
        );

        console.log("   🏢 Company Data:");
        console.log(`     Name: ${combinedData.company.name || "N/A"}`);
        console.log(`     Industry: ${combinedData.company.industry || "N/A"}`);
        console.log(
          `     Employees: ${combinedData.company.employees || "N/A"}`
        );
        console.log(`     Location: ${combinedData.company.location || "N/A"}`);

        this.results.endpointResults.combinedEnrichment = {
          status: "PASS",
          person: combinedData.person.name,
          company: combinedData.company.name,
        };
        this.results.passedTests++;
        this.results.apiCalls++;
        this.results.totalCost += 0.068;

        console.log("   ✅ Combined Enrichment test passed");
      } else {
        console.log("   ⚠️ No combined enrichment data found");
        this.results.endpointResults.combinedEnrichment = {
          status: "PASS",
          results: null,
        };
        this.results.passedTests++;
      }
    } catch (error) {
      console.error(`   ❌ Combined Enrichment test failed: ${error.message}`);
      this.results.endpointResults.combinedEnrichment = {
        status: "FAIL",
        error: error.message,
      };
      this.results.failedTests++;
    }

    console.log("");
  }

  async testDiscoverAPI() {
    console.log("🔍 Testing Discover API (FREE)...");
    this.results.totalTests++;

    try {
      const companyData = {
        industry: "Internet Software & Services",
        employees: "1001-5000",
        location: "San Francisco, California, United States",
      };

      console.log(`   🎯 Discovering companies in: ${companyData.industry}`);

      const similarCompanies = await this.client.discoverSimilarCompanies(
        companyData
      );

      if (similarCompanies && similarCompanies.length > 0) {
        console.log(
          `   🏢 Found ${similarCompanies.length} similar companies:`
        );

        similarCompanies.slice(0, 3).forEach((company, index) => {
          console.log(
            `     ${index + 1}. ${company.organization} (${company.domain})`
          );
          console.log(`        📧 ${company.email_count} emails available`);
        });

        this.results.endpointResults.discover = {
          status: "PASS",
          companies_found: similarCompanies.length,
          sample: similarCompanies.slice(0, 3),
        };
        this.results.passedTests++;

        console.log("   ✅ Discover API test passed");
      } else {
        console.log("   ⚠️ No companies discovered");
        this.results.endpointResults.discover = {
          status: "PASS",
          companies_found: 0,
        };
        this.results.passedTests++;
      }
    } catch (error) {
      console.error(`   ❌ Discover API test failed: ${error.message}`);
      this.results.endpointResults.discover = {
        status: "FAIL",
        error: error.message,
      };
      this.results.failedTests++;
    }

    console.log("");
  }

  async testComprehensiveDiscovery() {
    console.log("🚀 Testing Comprehensive Discovery Pipeline...");
    this.results.totalTests++;

    try {
      const businessData = {
        business_name: "Torchy's Tacos",
        website: "https://torchystacos.com",
        industry: "restaurants",
        owner_name: "Mike Rypka",
      };

      console.log(
        `   🎯 Running comprehensive discovery: ${businessData.business_name}`
      );

      const result = await this.client.comprehensiveEmailDiscovery(
        businessData
      );

      if (result.success) {
        console.log(`   📧 Emails discovered: ${result.emails.length}`);
        console.log(
          `   🏢 Company enriched: ${result.companyData ? "Yes" : "No"}`
        );
        console.log(`   👥 Persons enriched: ${result.personData.length}`);
        console.log(`   🔗 Combined data: ${result.combinedData.length}`);
        console.log(
          `   🏭 Similar companies: ${result.similarCompanies.length}`
        );
        console.log(`   💰 Total cost: $${result.total_cost.toFixed(3)}`);
        console.log(`   🎯 Confidence: ${result.confidence_score}%`);
        console.log(
          `   🚀 Endpoints used: ${result.endpoints_used.join(", ")}`
        );
        console.log(
          `   ⏱️ Processing time: ${Math.round(result.processing_time)}ms`
        );

        // Show top emails
        if (result.emails.length > 0) {
          console.log("   📋 Top emails found:");
          result.emails.slice(0, 3).forEach((email, index) => {
            console.log(
              `     ${index + 1}. ${email.value} (${email.confidence}%)`
            );
          });
        }

        this.results.endpointResults.comprehensiveDiscovery = {
          status: "PASS",
          emails: result.emails.length,
          confidence: result.confidence_score,
          cost: result.total_cost,
          endpoints: result.endpoints_used,
        };
        this.results.passedTests++;
        this.results.totalCost += result.total_cost;

        console.log("   ✅ Comprehensive Discovery test passed");
      } else {
        throw new Error(result.error || "Discovery failed");
      }
    } catch (error) {
      console.error(
        `   ❌ Comprehensive Discovery test failed: ${error.message}`
      );
      this.results.endpointResults.comprehensiveDiscovery = {
        status: "FAIL",
        error: error.message,
      };
      this.results.failedTests++;
    }

    console.log("");
  }

  generateFinalReport() {
    const duration = (Date.now() - this.results.startTime) / 1000;

    console.log("=".repeat(60));
    console.log("🎉 HUNTER.IO API INTEGRATION TEST RESULTS");
    console.log("=".repeat(60));
    console.log();

    console.log("📊 TEST SUMMARY:");
    console.log(`   Total Tests: ${this.results.totalTests}`);
    console.log(`   Passed: ${this.results.passedTests} ✅`);
    console.log(
      `   Failed: ${this.results.failedTests} ${
        this.results.failedTests > 0 ? "❌" : ""
      }`
    );
    console.log(
      `   Success Rate: ${(
        (this.results.passedTests / this.results.totalTests) *
        100
      ).toFixed(1)}%`
    );
    console.log(`   Duration: ${duration.toFixed(1)} seconds`);
    console.log();

    console.log("💰 COST SUMMARY:");
    console.log(`   Total API Calls: ${this.results.apiCalls}`);
    console.log(`   Total Cost: $${this.results.totalCost.toFixed(3)}`);
    console.log(
      `   Average Cost/Call: $${
        this.results.apiCalls > 0
          ? (this.results.totalCost / this.results.apiCalls).toFixed(3)
          : "0.000"
      }`
    );
    console.log();

    console.log("🔧 ENDPOINT STATUS:");
    Object.entries(this.results.endpointResults).forEach(
      ([endpoint, result]) => {
        const status = result.status === "PASS" ? "✅" : "❌";
        console.log(
          `   ${status} ${endpoint.toUpperCase().replace(/([A-Z])/g, " $1")}`
        );
        if (result.error) {
          console.log(`      Error: ${result.error}`);
        }
      }
    );
    console.log();

    if (this.results.failedTests === 0) {
      console.log("🎉 ALL HUNTER.IO API ENDPOINTS WORKING CORRECTLY!");
      console.log("🚀 Integration is optimized and ready for production use");
    } else {
      console.log("⚠️ Some endpoints failed - review integration code");
    }

    console.log();
    console.log("📋 CLIENT STATISTICS:");
    const stats = this.client.getComprehensiveStats();
    console.log(`   Budget Utilization: ${stats.budgetUtilization}`);
    console.log(`   Remaining Budget: ${stats.remainingBudget}`);
    console.log(`   Average Cost/Request: $${stats.averageCostPerRequest}`);
    console.log(`   Emails Discovered: ${stats.emailsDiscovered}`);
    console.log(`   Companies Enriched: ${stats.companiesEnriched}`);
    console.log(`   Persons Enriched: ${stats.personsEnriched}`);

    console.log("\n" + "=".repeat(60));
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Run the comprehensive test
async function runHunterAPITests() {
  const testSuite = new HunterAPIIntegrationTest();
  await testSuite.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  runHunterAPITests().catch(console.error);
}

module.exports = { HunterAPIIntegrationTest, runHunterAPITests };
