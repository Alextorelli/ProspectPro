// ProspectPro Supabase-First Frontend - Debug Version
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

class ProspectProSupabase {
  constructor() {
    console.log("🔧 Initializing ProspectPro with enhanced debugging...");

    // Initialize Supabase client with debugging
    this.supabase = createClient(
      "https://sriycekxdqnesdsgwiuc.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjU3ODksImV4cCI6MjA3MzU0MTc4OX0.Rx_1Hjz2eayKie0RpPB28i7_683ZwhVJ_5Eu_rzTWpI"
    );

    console.log("✅ Supabase client initialized");
    console.log("📍 Supabase URL:", this.supabase.supabaseUrl);
    console.log(
      "🔑 Anon key (first 50 chars):",
      this.supabase.supabaseKey.substring(0, 50) + "..."
    );

    this.selectedTool = "business-discovery";
    this.searchResults = [];
    this.lastSearchCampaignId = null;
    this.lastSearchCampaignName = null;
    this.costPerLead = 0.084;
    this.campaignRunning = false;

    this.initializeUI();
  }

  initializeUI() {
    // Existing UI initialization code...
    this.attachEventListeners();
    this.showWelcomeMessage();
  }

  attachEventListeners() {
    // Start Discovery Button
    const startButton = document.getElementById("start-discovery");
    if (startButton) {
      startButton.addEventListener("click", () => this.startDiscovery());
    }

    // Export Button
    const exportButton = document.getElementById("export-csv");
    if (exportButton) {
      exportButton.addEventListener("click", () => this.exportToCsv());
    }

    // Lead quantity buttons
    document.querySelectorAll(".lead-quantity-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".lead-quantity-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.updateCost();
      });
    });

    // Input fields for cost calculation
    const businessTypeInput = document.getElementById("business-type");
    const locationInput = document.getElementById("location");

    [businessTypeInput, locationInput].forEach((input) => {
      if (input) {
        input.addEventListener("input", () => this.updateCost());
      }
    });
  }

  async startDiscovery() {
    console.log("🚀 Starting business discovery...");

    if (this.campaignRunning) {
      console.log("⚠️ Campaign already running, skipping...");
      return;
    }

    const businessType = document.getElementById("business-type").value.trim();
    const location = document.getElementById("location").value.trim();
    const quantityBtn = document.querySelector(".lead-quantity-btn.active");
    const quantity = quantityBtn ? parseInt(quantityBtn.textContent) : 3;

    if (!businessType || !location) {
      this.showError("Please enter both business type and location");
      return;
    }

    console.log("📊 Discovery parameters:", {
      businessType,
      location,
      quantity,
    });

    this.campaignRunning = true;
    this.setLoadingState(true);
    this.showCampaignProgress(true);

    try {
      // Enhanced logging for debugging
      console.log("🔧 Preparing Edge Function call...");
      console.log("📡 Function name: business-discovery");
      console.log("📦 Payload:", {
        businessType,
        location,
        maxResults: quantity,
        budgetLimit: 50,
        requireCompleteContacts: false,
        minConfidenceScore: 50,
      });

      // Test Supabase client first
      console.log("🧪 Testing Supabase client...");
      console.log(
        "Client methods available:",
        Object.getOwnPropertyNames(this.supabase)
      );
      console.log("Functions object:", this.supabase.functions);

      // Call Supabase Edge Function with enhanced error logging
      console.log("📞 Calling Edge Function...");
      const startTime = Date.now();

      const { data, error } = await this.supabase.functions.invoke(
        "business-discovery",
        {
          body: {
            businessType,
            location,
            maxResults: quantity,
            budgetLimit: 50,
            requireCompleteContacts: false,
            minConfidenceScore: 50,
          },
        }
      );

      const endTime = Date.now();
      console.log(`⏱️ Edge Function call took ${endTime - startTime}ms`);

      console.log("📤 Raw response data:", data);
      console.log("❌ Raw error:", error);

      if (error) {
        console.error("🚨 Edge Function error details:", {
          message: error.message,
          status: error.status,
          statusCode: error.statusCode,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw new Error(`Edge Function error: ${error.message}`);
      }

      if (!data) {
        console.error("🚨 No data received from Edge Function");
        throw new Error("No data received from Edge Function");
      }

      if (!data.success) {
        console.error("🚨 Edge Function returned failure:", data);
        throw new Error(data.error || "Business discovery failed");
      }

      console.log("✅ Edge Function success! Results:", {
        totalFound: data.results?.totalFound,
        qualified: data.results?.qualified,
        campaignId: data.campaignId,
      });

      // Store results for potential export
      this.searchResults = data.leads || [];
      this.lastSearchCampaignId = data.campaignId;
      this.lastSearchCampaignName = `${businessType} in ${location}`;

      // Show results
      this.showResults(data);

      console.log(
        `✅ Discovery completed: ${this.searchResults.length} leads found`
      );
    } catch (error) {
      console.error("❌ Search error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      this.showError(`Discovery Failed: ${error.message}`);
    } finally {
      this.campaignRunning = false;
      this.setLoadingState(false);
      this.showCampaignProgress(false);
    }
  }

  // Test function to verify Supabase connection
  async testConnection() {
    console.log("🧪 Testing Supabase connection...");

    try {
      // Test a simple database query first
      const { data, error } = await this.supabase
        .from("campaigns")
        .select("count")
        .limit(1);

      if (error) {
        console.error("❌ Database connection failed:", error);
        return false;
      }

      console.log("✅ Database connection successful");

      // Test Edge Function with minimal payload
      const { data: funcData, error: funcError } =
        await this.supabase.functions.invoke("business-discovery", {
          body: {
            businessType: "test",
            location: "test",
            maxResults: 1,
          },
        });

      if (funcError) {
        console.error("❌ Edge Function test failed:", funcError);
        return false;
      }

      console.log("✅ Edge Function connection successful");
      return true;
    } catch (error) {
      console.error("❌ Connection test failed:", error);
      return false;
    }
  }

  // Rest of the methods (showResults, showError, etc.) remain the same...
  showResults(data) {
    const resultsContainer = document.getElementById("results-container");
    const resultsSection = document.getElementById("search-results");

    if (!resultsContainer || !resultsSection) return;

    resultsContainer.innerHTML = `
      <div class="discovery-summary">
        <h3>✅ Discovery Complete</h3>
        <div class="summary-stats">
          <div class="stat">
            <span class="stat-number">${data.results.totalFound}</span>
            <span class="stat-label">Businesses Found</span>
          </div>
          <div class="stat">
            <span class="stat-number">${data.results.qualified}</span>
            <span class="stat-label">Qualified Leads</span>
          </div>
          <div class="stat">
            <span class="stat-number">$${data.costs.totalCost.toFixed(3)}</span>
            <span class="stat-label">Total Cost</span>
          </div>
        </div>
      </div>
      
      <div class="leads-grid">
        ${data.leads
          .map(
            (lead) => `
          <div class="lead-card" data-score="${lead.optimizedScore}">
            <div class="lead-header">
              <h4>${lead.businessName}</h4>
              <span class="confidence-score score-${this.getScoreClass(
                lead.optimizedScore
              )}">
                ${lead.optimizedScore}%
              </span>
            </div>
            <div class="lead-details">
              <p><i class="icon-location"></i> ${lead.address}</p>
              ${
                lead.phone
                  ? `<p><i class="icon-phone"></i> ${lead.phone}</p>`
                  : ""
              }
              ${
                lead.website
                  ? `<p><i class="icon-web"></i> <a href="${lead.website}" target="_blank">${lead.website}</a></p>`
                  : ""
              }
              ${
                lead.email
                  ? `<p><i class="icon-email"></i> ${lead.email}</p>`
                  : ""
              }
            </div>
            <div class="lead-footer">
              <span class="cost-indicator">Cost: $${lead.validationCost.toFixed(
                3
              )}</span>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    resultsSection.style.display = "block";
    resultsContainer.scrollIntoView({ behavior: "smooth" });

    // Enable export button
    const exportButton = document.getElementById("export-csv");
    if (exportButton) {
      exportButton.style.display = "block";
    }
  }

  showError(message) {
    console.error("🚨 Showing error to user:", message);

    const resultsContainer = document.getElementById("results-container");
    const resultsSection = document.getElementById("search-results");

    if (!resultsContainer || !resultsSection) return;

    resultsContainer.innerHTML = `
      <div class="error-container">
        <h3>❌ Discovery Failed</h3>
        <p>${message}</p>
        <p class="error-note">This system only returns real data from actual APIs. If discovery fails, no fake data will be generated.</p>
        <button onclick="window.prospectPro.testConnection()" class="btn btn-secondary">
          🧪 Test Connection
        </button>
        <button onclick="window.prospectPro.startDiscovery()" class="btn btn-primary">
          🔄 Try Again
        </button>
      </div>
    `;

    resultsSection.style.display = "block";
    resultsContainer.scrollIntoView({ behavior: "smooth" });
  }

  getScoreClass(score) {
    if (score >= 80) return "high";
    if (score >= 60) return "medium";
    return "low";
  }

  setLoadingState(loading) {
    const startButton = document.getElementById("start-discovery");
    const loadingIndicator = document.querySelector(".loading-indicator");

    if (startButton) {
      if (loading) {
        startButton.textContent = "🔍 Discovering...";
        startButton.disabled = true;
      } else {
        startButton.textContent = "🚀 Start Discovery";
        startButton.disabled = false;
      }
    }

    if (loadingIndicator) {
      loadingIndicator.style.display = loading ? "block" : "none";
    }
  }

  showCampaignProgress(show) {
    const progressContainer = document.getElementById("campaign-progress");
    if (progressContainer) {
      progressContainer.style.display = show ? "block" : "none";
    }
  }

  updateCost() {
    const quantityBtn = document.querySelector(".lead-quantity-btn.active");
    const quantity = quantityBtn ? parseInt(quantityBtn.textContent) : 3;
    const estimatedCost = (quantity * this.costPerLead).toFixed(2);

    const costDisplay = document.querySelector(".estimated-cost");
    if (costDisplay) {
      costDisplay.textContent = `Estimated cost: $${estimatedCost}`;
    }
  }

  showWelcomeMessage() {
    console.log("🎉 ProspectPro Debug Version Ready!");
    console.log("🔧 Enhanced debugging enabled");
    console.log("📞 You can call testConnection() to verify setup");
  }

  async exportToCsv() {
    if (!this.lastSearchCampaignId) {
      this.showError("No campaign data to export");
      return;
    }

    try {
      const response = await fetch(
        `${this.supabase.supabaseUrl}/functions/v1/campaign-export/${this.lastSearchCampaignId}`,
        {
          headers: {
            Authorization: `Bearer ${this.supabase.supabaseKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${this.lastSearchCampaignName}_leads.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log("✅ CSV export completed");
    } catch (error) {
      console.error("❌ Export error:", error);
      this.showError(`Export failed: ${error.message}`);
    }
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM loaded, initializing ProspectPro Debug Version...");
  window.prospectPro = new ProspectProSupabase();
});

// Export for testing
window.ProspectProSupabase = ProspectProSupabase;
