// ProspectPro Supabase-First Frontend
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

class ProspectProSupabase {
  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      "https://sriycekxdqnesdsgwiuc.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjU3ODksImV4cCI6MjA3MzU0MTc4OX0.Rx_1Hjz2eayKie0RpPB28i7_683ZwhVJ_5Eu_rzTWpI"
    );

    this.selectedTool = "business-discovery";
    this.searchResults = [];
    this.lastSearchCampaignId = null;
    this.lastSearchCampaignName = null;
    this.costPerLead = 0.084;
    this.campaignRunning = false;
    this.sessionStats = null;
    this.selectedQuantity = 5;

    this.init();
  }

  async init() {
    console.log("🚀 ProspectPro Supabase-First Client initialized");

    // Check Supabase connection
    await this.checkSupabaseStatus();

    // Initialize business categories
    if (document.getElementById("categorySelect")) {
      this.initBusinessCategories();
    }

    // Bind events
    this.bindEvents();

    // Update initial cost estimate
    this.updateCostEstimate();
  }

  async checkSupabaseStatus() {
    try {
      const { data, error } = await this.supabase
        .from("campaigns")
        .select("count", { count: "exact" })
        .limit(1);

      if (error) {
        console.warn("Supabase connection issue:", error.message);
        this.showNotification(
          "Database connection issue - some features may be limited",
          "warning"
        );
      } else {
        console.log("✅ Supabase connection verified");
      }
    } catch (error) {
      console.error("Supabase status check failed:", error);
      this.showNotification("Unable to connect to database", "error");
    }
  }

  selectTemplate(templateType) {
    if (templateType === "local-business") {
      document.getElementById("businessType").value = "restaurant";
      document.getElementById("location").value = "San Francisco, CA";
    }
  }

  showPage(pageId) {
    // Hide all pages
    document.querySelectorAll(".page-content").forEach((page) => {
      page.style.display = "none";
    });

    // Show selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.style.display = "block";
    }
  }

  showSettings() {
    this.showPage("settingsPage");
    this.loadAdminData();
  }

  async loadAdminData() {
    try {
      // Get recent campaigns from Supabase
      const { data: campaigns, error } = await this.supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Failed to load campaigns:", error);
        return;
      }

      // Update recent campaigns display
      this.updateRecentCampaignsDisplay(campaigns || []);

      // Get campaign statistics
      const { data: stats } = await this.supabase
        .from("campaign_analytics")
        .select("*");

      if (stats) {
        this.updateEnhancedStatsDisplay({ success: true, data: stats });
      }
    } catch (error) {
      console.error("Admin data loading error:", error);
      this.showNotification("Failed to load admin data", "error");
    }
  }

  updateEnhancedStatsDisplay(statsData) {
    if (statsData.success && statsData.data) {
      const stats = statsData.data;
      const totalCampaigns = stats.length;
      const totalLeads = stats.reduce(
        (sum, s) => sum + (s.actual_leads || 0),
        0
      );
      const avgConfidence =
        stats.reduce((sum, s) => sum + (s.avg_confidence || 0), 0) /
          stats.length || 0;
      const totalCost = stats.reduce((sum, s) => sum + (s.total_cost || 0), 0);

      // Update dashboard elements
      const elements = {
        totalCampaigns: document.getElementById("totalCampaigns"),
        totalLeads: document.getElementById("totalLeads"),
        avgConfidence: document.getElementById("avgConfidence"),
        totalCost: document.getElementById("totalCost"),
      };

      if (elements.totalCampaigns)
        elements.totalCampaigns.textContent = totalCampaigns;
      if (elements.totalLeads) elements.totalLeads.textContent = totalLeads;
      if (elements.avgConfidence)
        elements.avgConfidence.textContent = `${avgConfidence.toFixed(1)}%`;
      if (elements.totalCost)
        elements.totalCost.textContent = `$${totalCost.toFixed(2)}`;
    }
  }

  updateRecentCampaignsDisplay(campaigns) {
    const recentCampaignsEl = document.getElementById("recentCampaigns");
    if (!recentCampaignsEl || !campaigns.length) return;

    const campaignsList = campaigns
      .slice(0, 5)
      .map((campaign) => {
        const date = new Date(campaign.created_at).toLocaleDateString();
        return `
          <div class="campaign-item">
            <div class="campaign-info">
              <strong>${campaign.business_type || "Unknown"}</strong>
              <span class="campaign-location">${
                campaign.location || "Unknown location"
              }</span>
              <span class="campaign-date">${date}</span>
            </div>
            <div class="campaign-stats">
              <span class="campaign-leads">${
                campaign.results_count || 0
              } leads</span>
              <span class="campaign-cost">$${(campaign.total_cost || 0).toFixed(
                2
              )}</span>
              <button onclick="prospectProApp.exportCampaignLeads('${
                campaign.id
              }')" class="btn-export">Export</button>
            </div>
          </div>
        `;
      })
      .join("");

    recentCampaignsEl.innerHTML = campaignsList;
  }

  goHome() {
    this.showPage("discoveryPage");
  }

  updateCostEstimate() {
    const quantity = parseInt(
      document.getElementById("quantity")?.value || "5"
    );
    this.selectedQuantity = quantity;

    // Base cost calculation
    const baseCost = quantity * this.costPerLead;

    // Apollo enhancement cost
    const apolloEnabled =
      document.getElementById("apolloDiscovery")?.checked || false;
    const apolloCost = apolloEnabled ? quantity * 1.0 : 0;

    // Total cost
    const totalCost = baseCost + apolloCost;

    // Update main cost display
    const costElement = document.getElementById("estimatedCost");
    if (costElement) {
      costElement.textContent = `$${totalCost.toFixed(2)}`;
    }

    // Update cost breakdown
    const baseCostElement = document.getElementById("baseCost");
    const apolloCostElement = document.getElementById("apolloCost");
    const apolloCostLine = document.getElementById("apolloCostLine");
    const costBreakdown = document.getElementById("costBreakdown");

    if (baseCostElement) {
      baseCostElement.textContent = `$${baseCost.toFixed(2)}`;
    }

    if (apolloCostElement) {
      apolloCostElement.textContent = `$${apolloCost.toFixed(2)}`;
    }

    if (apolloCostLine) {
      apolloCostLine.style.display = apolloEnabled ? "flex" : "none";
    }

    if (costBreakdown) {
      costBreakdown.style.display = apolloEnabled ? "block" : "none";
    }
  }

  bindEvents() {
    // Search button
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
      searchBtn.onclick = () => this.handleSearch();
    }

    // Export button
    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
      exportBtn.onclick = () => this.exportResults();
    }

    // Quantity slider
    const quantitySlider = document.getElementById("quantity");
    if (quantitySlider) {
      quantitySlider.oninput = () => this.updateCostEstimate();
    }

    // Enhancement option checkboxes
    const enhancementCheckboxes = [
      "tradeAssociations",
      "professionalLicensing",
      "chamberVerification",
      "apolloDiscovery",
    ];

    enhancementCheckboxes.forEach((id) => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.onchange = () => this.updateCostEstimate();
      }
    });

    // Settings button
    const settingsBtn = document.getElementById("settingsBtn");
    if (settingsBtn) {
      settingsBtn.onclick = () => this.showSettings();
    }

    // Home button
    const homeBtn = document.getElementById("homeBtn");
    if (homeBtn) {
      homeBtn.onclick = () => this.goHome();
    }
  }

  async handleSearch() {
    if (this.campaignRunning) {
      console.log("Campaign already running, ignoring request");
      return;
    }

    const businessType = document.getElementById("businessType")?.value;
    const location = document.getElementById("location")?.value;
    const quantity = parseInt(
      document.getElementById("quantity")?.value || "5"
    );

    // Get enhancement options
    const tradeAssociations =
      document.getElementById("tradeAssociations")?.checked || false;
    const professionalLicensing =
      document.getElementById("professionalLicensing")?.checked || false;
    const chamberVerification =
      document.getElementById("chamberVerification")?.checked || false;
    const apolloDiscovery =
      document.getElementById("apolloDiscovery")?.checked || false;

    if (!businessType || !location) {
      this.showError("Please enter both business type and location");
      return;
    }

    this.campaignRunning = true;
    this.setLoadingState(true);
    this.showCampaignProgress(true);

    try {
      console.log(
        `🔍 Starting business discovery: ${businessType} in ${location}`
      );

      // Log enhancement options
      if (
        tradeAssociations ||
        professionalLicensing ||
        chamberVerification ||
        apolloDiscovery
      ) {
        console.log("🚀 P1 Enhancements enabled:", {
          tradeAssociations,
          professionalLicensing,
          chamberVerification,
          apolloDiscovery,
        });
      }

      // Call Supabase Edge Function with enhancement options
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
            // P1 Enhancement options
            tradeAssociations,
            professionalLicensing,
            chamberVerification,
            apolloDiscovery,
          },
        }
      );

      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || "Business discovery failed");
      }

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
      console.error("❌ Search error:", error);
      this.showError(error.message || "Business discovery failed");
    } finally {
      this.campaignRunning = false;
      this.setLoadingState(false);
      this.showCampaignProgress(false);
    }
  }

  showCampaignProgress(isRunning) {
    const progressContainer = document.getElementById("campaignProgress");
    if (progressContainer) {
      progressContainer.style.display = isRunning ? "block" : "none";

      if (isRunning) {
        this.animateProgressSteps();
      }
    }
  }

  animateProgressSteps() {
    const steps = [
      "Searching for businesses...",
      "Validating contact information...",
      "Scoring lead quality...",
      "Generating results...",
    ];

    const progressText = document.getElementById("progressText");
    let currentStep = 0;

    const interval = setInterval(() => {
      if (progressText && currentStep < steps.length) {
        progressText.textContent = steps[currentStep];
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 2000);
  }

  setLoadingState(isLoading) {
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
      searchBtn.disabled = isLoading;
      searchBtn.textContent = isLoading ? "Searching..." : "Search Businesses";
    }
  }

  showResults(result) {
    const resultsContainer = document.getElementById("results");
    if (!resultsContainer) return;

    // Clear previous results
    resultsContainer.innerHTML = "";
    resultsContainer.style.display = "block";

    const leads = result.leads || [];
    const stats = result.results || {};

    if (leads.length === 0) {
      this.showInsufficientResults(result);
      return;
    }

    // Results header
    const header = document.createElement("div");
    header.className = "results-header";
    header.innerHTML = `
      <h3>🎯 Discovery Results</h3>
      <div class="results-stats">
        <span class="stat-item">
          <strong>${stats.totalFound || leads.length}</strong> businesses found
        </span>
        <span class="stat-item">
          <strong>${stats.qualified || leads.length}</strong> qualified leads
        </span>
        <span class="stat-item">
          Qualification rate: <strong>${
            stats.qualificationRate || "100%"
          }</strong>
        </span>
        <span class="stat-item">
          Avg confidence: <strong>${stats.averageConfidence || 0}%</strong>
        </span>
      </div>
      <div class="results-actions">
        <button id="exportCurrentBtn" class="btn btn-secondary">📊 Export Results</button>
      </div>
    `;
    resultsContainer.appendChild(header);

    // Results grid
    const grid = document.createElement("div");
    grid.className = "results-grid";

    leads.forEach((business, index) => {
      const card = this.createEnhancedBusinessCard(business, index);
      grid.appendChild(card);
    });

    resultsContainer.appendChild(grid);

    // Bind export button
    const exportCurrentBtn = document.getElementById("exportCurrentBtn");
    if (exportCurrentBtn) {
      exportCurrentBtn.onclick = () => this.exportResults();
    }

    // Update session stats
    this.updateSessionStats();
  }

  createEnhancedBusinessCard(business, index) {
    const card = document.createElement("div");
    card.className = "business-card enhanced";

    const confidence =
      business.optimizedScore || business.confidence_score || 0;
    const scoreClass =
      confidence >= 80 ? "high" : confidence >= 60 ? "medium" : "low";

    card.innerHTML = `
      <div class="card-header">
        <h4 class="business-name">${
          business.businessName || business.business_name || "Unknown Business"
        }</h4>
        <div class="confidence-score ${scoreClass}">
          <span class="score-value">${confidence}%</span>
          <span class="score-label">Confidence</span>
        </div>
      </div>
      
      <div class="card-body">
        <div class="contact-info">
          <div class="info-item">
            <span class="info-icon">📍</span>
            <span class="info-text">${
              business.address || "Address not available"
            }</span>
          </div>
          
          ${
            business.phone
              ? `
            <div class="info-item">
              <span class="info-icon">📞</span>
              <span class="info-text">${business.phone}</span>
            </div>
          `
              : ""
          }
          
          ${
            business.website
              ? `
            <div class="info-item">
              <span class="info-icon">🌐</span>
              <a href="${business.website}" target="_blank" class="info-link">${business.website}</a>
            </div>
          `
              : ""
          }
          
          ${
            business.email
              ? `
            <div class="info-item">
              <span class="info-icon">✉️</span>
              <span class="info-text">${business.email}</span>
            </div>
          `
              : ""
          }
        </div>
        
        ${
          business.scoringRecommendation || business.scoring_recommendation
            ? `
          <div class="recommendation">
            <strong>Recommendation:</strong> ${
              business.scoringRecommendation || business.scoring_recommendation
            }
          </div>
        `
            : ""
        }
      </div>
    `;

    return card;
  }

  showInsufficientResults(result) {
    const resultsContainer = document.getElementById("results");
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
      <div class="insufficient-results">
        <h3>🎯 Limited Results Found</h3>
        <p>We found ${result.results?.totalFound || 0} businesses, but only ${
      result.results?.qualified || 0
    } met your quality criteria.</p>
        
        <div class="suggestions">
          <h4>💡 Try these improvements:</h4>
          <ul>
            <li>Expand your search radius</li>
            <li>Try different business types (e.g., "cafe" instead of "coffee shop")</li>
            <li>Lower the minimum confidence score</li>
            <li>Try a different location or nearby city</li>
          </ul>
        </div>
        
        <div class="retry-section">
          <button onclick="prospectProApp.goHome()" class="btn btn-primary">🔍 Try New Search</button>
        </div>
      </div>
    `;
    resultsContainer.style.display = "block";
  }

  showError(message) {
    const resultsContainer = document.getElementById("results");
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
      <div class="error-results">
        <h3>❌ Search Error</h3>
        <p>${message}</p>
        <button onclick="prospectProApp.goHome()" class="btn btn-primary">🔍 Try Again</button>
      </div>
    `;
    resultsContainer.style.display = "block";
  }

  async exportResults() {
    if (!this.lastSearchCampaignId) {
      this.showNotification("No campaign results to export", "warning");
      return;
    }

    try {
      console.log(`📊 Exporting campaign ${this.lastSearchCampaignId}`);

      // Call Supabase Edge Function for export
      const { data, error } = await this.supabase.functions.invoke(
        "campaign-export",
        {
          body: { campaignId: this.lastSearchCampaignId },
        }
      );

      if (error) {
        throw new Error(`Export error: ${error.message}`);
      }

      // Trigger download
      const blob = new Blob([data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `campaign_${this.lastSearchCampaignId.slice(
        0,
        8
      )}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.showNotification("Export completed successfully", "success");
    } catch (error) {
      console.error("Export error:", error);
      this.showNotification("Export failed: " + error.message, "error");
    }
  }

  async exportCampaignLeads(campaignId) {
    try {
      console.log(`📊 Exporting campaign ${campaignId}`);

      // Use fetch to call the edge function directly for CSV export
      const response = await fetch(
        `${this.supabase.supabaseUrl}/functions/v1/campaign-export/${campaignId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.supabase.supabaseKey}`,
            Accept: "text/csv",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const csvData = await response.text();
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ||
        `campaign_${campaignId.slice(0, 8)}.csv`;

      // Trigger download
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.showNotification("Campaign exported successfully", "success");
    } catch (error) {
      console.error("Campaign export error:", error);
      this.showNotification("Export failed: " + error.message, "error");
    }
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">×</button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  updateSessionStats() {
    // Update current session performance if elements exist
    const sessionStatsEl = document.getElementById("currentSessionStats");
    if (!sessionStatsEl) return;

    this.sessionStats = {
      campaignsRun: 1,
      totalLeads: this.searchResults.length,
      avgConfidence:
        this.searchResults.reduce(
          (sum, lead) => sum + (lead.optimizedScore || 0),
          0
        ) / this.searchResults.length || 0,
      totalCost: this.searchResults.reduce(
        (sum, lead) => sum + (lead.validationCost || 0),
        0
      ),
    };

    sessionStatsEl.innerHTML = `
      <h4>Current Session</h4>
      <div class="stat-grid">
        <div class="stat-item">
          <span class="stat-value">${this.sessionStats.campaignsRun}</span>
          <span class="stat-label">Campaigns Run</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${this.sessionStats.totalLeads}</span>
          <span class="stat-label">Leads Found</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${this.sessionStats.avgConfidence.toFixed(
            1
          )}%</span>
          <span class="stat-label">Avg Confidence</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">$${this.sessionStats.totalCost.toFixed(
            2
          )}</span>
          <span class="stat-label">Session Cost</span>
        </div>
      </div>
    `;
  }

  initBusinessCategories() {
    const categories = [
      "restaurant",
      "retail store",
      "professional services",
      "healthcare",
      "automotive",
      "real estate",
      "fitness",
      "beauty salon",
      "legal services",
      "accounting",
      "consulting",
      "technology",
      "marketing agency",
      "dental office",
    ];

    const categorySelect = document.getElementById("categorySelect");
    if (categorySelect) {
      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent =
          category.charAt(0).toUpperCase() + category.slice(1);
        categorySelect.appendChild(option);
      });

      categorySelect.onchange = () => {
        const businessTypeInput = document.getElementById("businessType");
        if (businessTypeInput) {
          businessTypeInput.value = categorySelect.value;
        }
      };
    }
  }
}

// Initialize the application
let prospectProApp;
document.addEventListener("DOMContentLoaded", () => {
  prospectProApp = new ProspectProSupabase();
});
