// ProspectPro Supabase-First Frontend - Enhanced Error Tracking Version
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

class ProspectProSupabase {
  constructor() {
    console.log("🔧 ProspectPro initializing with enhanced error tracking...");
    
    // Enhanced error tracking
    window.addEventListener('error', (e) => {
      console.error('🚨 Global JavaScript Error:', e.error);
      console.error('📍 File:', e.filename, 'Line:', e.lineno);
    });
    
    window.addEventListener('unhandledrejection', (e) => {
      console.error('🚨 Unhandled Promise Rejection:', e.reason);
    });

    try {
      // Initialize Supabase client
      this.supabase = createClient(
        "https://sriycekxdqnesdsgwiuc.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjU3ODksImV4cCI6MjA3MzU0MTc4OX0.Rx_1Hjz2eayKie0RpPB28i7_683ZwhVJ_5Eu_rzTWpI"
      );

      console.log("✅ Supabase client created successfully");
      console.log("📍 URL:", this.supabase.supabaseUrl);
      console.log("🔑 Key (first 50):", this.supabase.supabaseKey.substring(0, 50) + "...");
      
      // Test client immediately
      this.testSupabaseClient();

    } catch (error) {
      console.error("🚨 CRITICAL: Supabase client creation failed:", error);
      this.showError("Failed to initialize Supabase client: " + error.message);
      return;
    }

    this.selectedTool = "business-discovery";
    this.searchResults = [];
    this.lastSearchCampaignId = null;
    this.lastSearchCampaignName = null;
    this.costPerLead = 0.084;
    this.campaignRunning = false;

    this.initializeUI();
  }

  async testSupabaseClient() {
    try {
      console.log("🧪 Testing Supabase client connectivity...");
      
      // Test if functions object exists
      if (!this.supabase.functions) {
        throw new Error("Supabase functions object is undefined");
      }
      
      console.log("✅ Supabase functions object exists");
      console.log("📋 Functions methods:", Object.getOwnPropertyNames(this.supabase.functions));
      
      // Test if invoke method exists
      if (typeof this.supabase.functions.invoke !== 'function') {
        throw new Error("Supabase functions.invoke is not a function");
      }
      
      console.log("✅ Supabase functions.invoke method exists");
      
    } catch (error) {
      console.error("🚨 Supabase client test failed:", error);
    }
  }

  initializeUI() {
    console.log("🎨 Initializing UI...");
    
    try {
      this.attachEventListeners();
      this.updateCost();
      this.showWelcomeMessage();
      console.log("✅ UI initialization complete");
    } catch (error) {
      console.error("🚨 UI initialization failed:", error);
    }
  }

  attachEventListeners() {
    console.log("🔗 Attaching event listeners...");

    // Start Discovery Button
    const startButton = document.getElementById("start-discovery");
    if (startButton) {
      console.log("✅ Found start discovery button");
      startButton.addEventListener("click", (e) => {
        console.log("🖱️ Start discovery button clicked");
        e.preventDefault();
        this.startDiscovery();
      });
    } else {
      console.error("❌ Start discovery button not found!");
    }

    // Export Button
    const exportButton = document.getElementById("export-csv");
    if (exportButton) {
      exportButton.addEventListener("click", () => this.exportToCsv());
    }

    // Lead quantity buttons
    const quantityButtons = document.querySelectorAll(".lead-quantity-btn");
    console.log(`🔢 Found ${quantityButtons.length} quantity buttons`);
    
    quantityButtons.forEach((btn) => {
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
    
    console.log("✅ Event listeners attached");
  }

  async startDiscovery() {
    console.log("🚀 === STARTING DISCOVERY ===");
    
    if (this.campaignRunning) {
      console.log("⚠️ Campaign already running, skipping...");
      return;
    }

    try {
      const businessType = document.getElementById("business-type").value.trim();
      const location = document.getElementById("location").value.trim();
      const quantityBtn = document.querySelector(".lead-quantity-btn.active");
      const quantity = quantityBtn ? parseInt(quantityBtn.textContent) : 3;

      console.log("📊 Discovery parameters:", { businessType, location, quantity });

      if (!businessType || !location) {
        console.log("❌ Missing required parameters");
        this.showError("Please enter both business type and location");
        return;
      }

      this.campaignRunning = true;
      this.setLoadingState(true);
      this.showCampaignProgress(true);

      // Enhanced pre-flight checks
      console.log("🔍 Pre-flight checks...");
      
      if (!this.supabase) {
        throw new Error("Supabase client is not initialized");
      }
      
      if (!this.supabase.functions) {
        throw new Error("Supabase functions object is missing");
      }
      
      if (typeof this.supabase.functions.invoke !== 'function') {
        throw new Error("Supabase functions.invoke is not a function");
      }
      
      console.log("✅ Pre-flight checks passed");

      const payload = {
        businessType,
        location,
        maxResults: quantity,
        budgetLimit: 50,
        requireCompleteContacts: false,
        minConfidenceScore: 50,
      };

      console.log("📦 Edge Function payload:", JSON.stringify(payload, null, 2));
      console.log("📞 Calling Edge Function: business-discovery");

      const startTime = Date.now();

      // Call Supabase Edge Function with enhanced error tracking
      const result = await this.supabase.functions.invoke(
        "business-discovery",
        {
          body: payload,
        }
      );

      const endTime = Date.now();
      console.log(`⏱️ Edge Function call completed in ${endTime - startTime}ms`);

      console.log("📥 Raw Edge Function result:", result);

      const { data, error } = result;

      console.log("📊 Parsed result - Data:", data);
      console.log("❌ Parsed result - Error:", error);

      if (error) {
        console.error("🚨 Edge Function returned error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status: error.status,
          statusCode: error.statusCode
        });
        throw new Error(`Edge Function error: ${error.message || JSON.stringify(error)}`);
      }

      if (!data) {
        console.error("🚨 No data received from Edge Function");
        throw new Error("No data received from Edge Function");
      }

      console.log("📋 Data type:", typeof data);
      console.log("📋 Data keys:", Object.keys(data));

      if (!data.success) {
        console.error("🚨 Edge Function returned failure:", data);
        throw new Error(data.error || data.message || "Business discovery failed");
      }

      console.log("🎉 Edge Function success!");
      console.log("📊 Results summary:", {
        totalFound: data.results?.totalFound,
        qualified: data.results?.qualified,
        campaignId: data.campaignId,
        leadsCount: data.leads?.length
      });

      // Store results for potential export
      this.searchResults = data.leads || [];
      this.lastSearchCampaignId = data.campaignId;
      this.lastSearchCampaignName = `${businessType} in ${location}`;

      // Show results
      this.showResults(data);

      console.log(`✅ Discovery completed: ${this.searchResults.length} leads found`);
      
    } catch (error) {
      console.error("🚨 === DISCOVERY ERROR ===");
      console.error("Error type:", typeof error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Full error object:", error);
      
      // Show detailed error to user
      let errorMessage = "Business discovery failed";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      this.showError(`Discovery Failed: ${errorMessage}`);
      
    } finally {
      console.log("🏁 Discovery cleanup...");
      this.campaignRunning = false;
      this.setLoadingState(false);
      this.showCampaignProgress(false);
    }
  }

  // Rest of methods remain the same but with enhanced logging...
  showResults(data) {
    console.log("📊 Displaying results...", data);
    
    const resultsContainer = document.getElementById("results-container");
    const resultsSection = document.getElementById("search-results");

    if (!resultsContainer || !resultsSection) {
      console.error("❌ Results containers not found");
      return;
    }

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
        ${data.leads.map(lead => `
          <div class="lead-card" data-score="${lead.optimizedScore}">
            <div class="lead-header">
              <h4>${lead.businessName}</h4>
              <span class="confidence-score score-${this.getScoreClass(lead.optimizedScore)}">
                ${lead.optimizedScore}%
              </span>
            </div>
            <div class="lead-details">
              <p><i class="icon-location"></i> ${lead.address}</p>
              ${lead.phone ? `<p><i class="icon-phone"></i> ${lead.phone}</p>` : ''}
              ${lead.website ? `<p><i class="icon-web"></i> <a href="${lead.website}" target="_blank">${lead.website}</a></p>` : ''}
              ${lead.email ? `<p><i class="icon-email"></i> ${lead.email}</p>` : ''}
            </div>
            <div class="lead-footer">
              <span class="cost-indicator">Cost: $${lead.validationCost.toFixed(3)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    resultsSection.style.display = "block";
    resultsContainer.scrollIntoView({ behavior: "smooth" });

    // Enable export button
    const exportButton = document.getElementById("export-csv");
    if (exportButton) {
      exportButton.style.display = "block";
    }
    
    console.log("✅ Results displayed successfully");
  }

  showError(message) {
    console.error("🚨 Showing error to user:", message);
    
    const resultsContainer = document.getElementById("results-container");
    const resultsSection = document.getElementById("search-results");

    if (!resultsContainer || !resultsSection) {
      console.error("❌ Error: Results containers not found");
      alert("Error: " + message); // Fallback
      return;
    }

    resultsContainer.innerHTML = `
      <div class="error-container">
        <h3>❌ Discovery Failed</h3>
        <p>Business discovery failed: API request failed: 404</p>
        <p class="error-detail"><strong>Technical Details:</strong> ${message}</p>
        <p class="error-note">This system only returns real data from actual APIs. If discovery fails, no fake data will be generated.</p>
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
    console.log("🎉 ProspectPro Enhanced Error Tracking Version Ready!");
  }

  async exportToCsv() {
    // Export functionality remains the same
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
  console.log("🚀 DOM loaded, initializing ProspectPro Enhanced Error Tracking...");
  try {
    window.prospectPro = new ProspectProSupabase();
    console.log("✅ ProspectPro initialized successfully");
  } catch (error) {
    console.error("🚨 CRITICAL: Failed to initialize ProspectPro:", error);
    alert("Critical error: " + error.message);
  }
});

// Export for testing
window.ProspectProSupabase = ProspectProSupabase;