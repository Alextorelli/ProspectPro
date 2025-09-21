// ProspectPro v2.0 Real API Client - Enhanced with Phase 1 API Integration
class ProspectProRealAPI {
  constructor() {
    this.baseUrl = window.location.origin;
    this.selectedTool = "business-discovery";
    this.searchResults = [];
    this.lastSearchCampaignId = null;
    this.lastSearchCampaignName = null;
    // SECURITY: Access token will be provided by authenticated session
    this.accessToken = window.PERSONAL_ACCESS_TOKEN || "UNAUTHORIZED";

    this.costPerLead = 0.084; // Base estimated cost per lead with enrichment
    this.campaignRunning = false; // Track campaign status
    this.sessionStats = null; // Track current session statistics

    this.init();
  }

  async init() {
    console.log("🚀 ProspectPro Real API Client initialized");

    // Check API status
    await this.checkApiStatus();

    // Initialize business categories (only when on business page)
    if (document.getElementById("categorySelect")) {
      this.initBusinessCategories();
    }

    // Bind events
    this.bindEvents();

    // Update initial cost estimate
    this.updateCostEstimate();

    // Set initial lead quantity
    this.selectedQuantity = 5;
  }

  selectTemplate(templateType) {
    if (templateType === "local-business") {
      this.showPage("localBusinessPage");
      this.initBusinessCategories();
    }
  }

  showPage(pageId) {
    // Hide all pages
    document.querySelectorAll(".page-content").forEach((page) => {
      page.classList.add("hidden");
    });

    // Show selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.classList.remove("hidden");
    }
  }

  showSettings() {
    this.showPage("settingsPage");
    this.loadAdminData();
  }

  async loadAdminData() {
    try {
      // Load enhanced campaign statistics from the business discovery API
      const statsResponse = await fetch(`${this.baseUrl}/api/business/stats`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        this.updateEnhancedStatsDisplay(statsData);
      } else {
        console.warn("Stats API not available, using placeholder data");
        this.updateStatsDisplay({
          totalSearches: "N/A",
          totalLeads: "N/A",
          totalCost: "N/A",
          avgConfidence: "N/A",
        });
      }

      // Show current session stats if available
      if (this.sessionStats) {
        this.updateSessionStatsDisplay();
      }
    } catch (error) {
      console.error("Failed to load admin data:", error);
      // Show placeholder data
      this.updateStatsDisplay({
        totalSearches: "N/A",
        totalLeads: "N/A",
        totalCost: "N/A",
        avgConfidence: "N/A",
      });
    }
  }

  updateEnhancedStatsDisplay(statsData) {
    if (statsData.success) {
      const aggregateStats = statsData.aggregateStats || {};
      const currentSession = statsData.currentSessionStats || {};

      // Update aggregate statistics
      document.getElementById("totalSearches").textContent =
        aggregateStats.totalCampaigns || "0";
      document.getElementById("totalLeads").textContent =
        aggregateStats.totalOwnerFound || "0";
      document.getElementById("totalCost").textContent = `$${(
        aggregateStats.totalCost || 0
      ).toFixed(2)}`;
      document.getElementById("avgConfidence").textContent = `${Math.round(
        aggregateStats.averageSuccessRate || 0
      )}%`;

      // Update additional metrics if elements exist
      const totalBusinessesEl = document.getElementById("totalBusinesses");
      if (totalBusinessesEl) {
        totalBusinessesEl.textContent =
          aggregateStats.totalBusinessesProcessed || "0";
      }

      const avgCostPerLeadEl = document.getElementById("avgCostPerLead");
      if (avgCostPerLeadEl) {
        avgCostPerLeadEl.textContent = `$${(
          aggregateStats.averageCostPerLead || 0
        ).toFixed(4)}`;
      }

      const emailVerificationRateEl = document.getElementById(
        "emailVerificationRate"
      );
      if (emailVerificationRateEl) {
        const rate =
          aggregateStats.totalEmailsVerified && aggregateStats.totalEmailsFound
            ? (aggregateStats.totalEmailsVerified /
                aggregateStats.totalEmailsFound) *
              100
            : 0;
        emailVerificationRateEl.textContent = `${Math.round(rate)}%`;
      }

      // Update API usage breakdown
      this.updateApiUsageDisplay(aggregateStats.apiUsage || {});

      // Display recent campaigns
      if (statsData.recentCampaigns) {
        this.updateRecentCampaignsDisplay(statsData.recentCampaigns);
      }
    }
  }

  updateApiUsageDisplay(apiUsage) {
    const freeCallsEl = document.getElementById("freeApiCalls");
    const lowCostCallsEl = document.getElementById("lowCostApiCalls");
    const expensiveCallsEl = document.getElementById("expensiveApiCalls");

    if (freeCallsEl) freeCallsEl.textContent = apiUsage.free || "0";
    if (lowCostCallsEl) lowCostCallsEl.textContent = apiUsage.lowCost || "0";
    if (expensiveCallsEl)
      expensiveCallsEl.textContent = apiUsage.expensive || "0";
  }

  updateRecentCampaignsDisplay(campaigns) {
    const recentCampaignsEl = document.getElementById("recentCampaigns");
    if (!recentCampaignsEl || !campaigns.length) return;

    const campaignsList = campaigns
      .slice(0, 5)
      .map((campaign) => {
        const date = new Date(campaign.timestamp).toLocaleDateString();
        const time = new Date(campaign.timestamp).toLocaleTimeString();
        const successRate = campaign.performance?.successRate || 0;
        const cost = campaign.costs?.totalActualCost || 0;

        return `
                <div class="campaign-item">
                    <div class="campaign-header">
                        <span class="campaign-type">${
                          campaign.parameters.businessType
                        }</span>
                        <span class="campaign-location">${
                          campaign.parameters.location
                        }</span>
                        <span class="campaign-date">${date} ${time}</span>
                    </div>
                    <div class="campaign-metrics">
                        <span class="metric">📊 ${
                          campaign.results.totalBusinessesFound
                        } found</span>
                        <span class="metric">👤 ${
                          campaign.results.businessesWithOwners
                        } with owners</span>
                        <span class="metric">✅ ${successRate}% success</span>
                        <span class="metric">💰 $${cost.toFixed(4)}</span>
                    </div>
                </div>
            `;
      })
      .join("");

    recentCampaignsEl.innerHTML = campaignsList;
  }

  updateSessionStatsDisplay() {
    // Update current session performance if elements exist
    const sessionStatsEl = document.getElementById("currentSessionStats");
    if (!sessionStatsEl || !this.sessionStats) return;

    const { stats, costs, performance } = this.sessionStats;

    sessionStatsEl.innerHTML = `
            <h4>Current Session</h4>
            <div class="session-metrics">
                <div class="metric-item">
                    <span class="metric-value">${stats.withOwners || 0}</span>
                    <span class="metric-label">Owners Found</span>
                </div>
                <div class="metric-item">
                    <span class="metric-value">${
                      stats.withVerifiedEmails || 0
                    }</span>
                    <span class="metric-label">Verified Emails</span>
                </div>
                <div class="metric-item">
                    <span class="metric-value">$${(
                      costs.totalEstimated || 0
                    ).toFixed(4)}</span>
                    <span class="metric-label">Session Cost</span>
                </div>
                <div class="metric-item">
                    <span class="metric-value">${
                      performance.qualityDistribution?.A || 0
                    }</span>
                    <span class="metric-label">Grade A Leads</span>
                </div>
            </div>
        `;
  }

  updateStatsDisplay(stats) {
    document.getElementById("totalSearches").textContent =
      stats.totalSearches || "0";
    document.getElementById("totalLeads").textContent = stats.totalLeads || "0";
    document.getElementById("totalCost").textContent =
      stats.totalCost || "$0.00";
    document.getElementById("avgConfidence").textContent = stats.avgConfidence
      ? `${stats.avgConfidence}%`
      : "0%";
  }

  updatePerformanceDisplay(performance) {
    // Update API status indicators
    const apis = ["googlePlaces", "ownerDiscovery", "emailValidation"];

    apis.forEach((api) => {
      const statusEl = document.getElementById(`${api}Status`);
      const usageEl = document.getElementById(`${api}Usage`);

      if (statusEl && usageEl) {
        const apiData = performance[api] || {};
        statusEl.textContent = apiData.status || "Unknown";
        statusEl.className = `api-status ${
          apiData.status === "Active" ? "status-active" : "status-inactive"
        }`;
        usageEl.textContent = apiData.usage || "0 calls";
      }
    });
  }

  saveAdminSettings() {
    const settings = {
      confidenceThreshold: document.getElementById("confidenceThreshold").value,
      maxLeadsPerSearch: document.getElementById("maxLeadsPerSearch").value,
      ownerDiscoveryEnabled: document.getElementById("ownerDiscoveryEnabled")
        .checked,
    };

    // Save settings (in production, this would make an API call)
    localStorage.setItem("adminSettings", JSON.stringify(settings));

    alert("Settings saved successfully!");
    console.log("Admin settings saved:", settings);
  }

  goHome() {
    this.showPage("homePage");
  }

  updateCostEstimate() {
    const leadCount = this.selectedQuantity || 5;
    const estimatedCost = (leadCount * this.costPerLead).toFixed(2);
    const costElement = document.getElementById("costEstimate");
    if (costElement) {
      costElement.textContent = `$${estimatedCost}`;
    }
  }

  async checkApiStatus() {
    try {
      // First check basic health
      const healthResponse = await fetch(`${this.baseUrl}/health`);
      const healthStatus = await healthResponse.json();

      // Then check detailed API status
      const statusResponse = await fetch(`${this.baseUrl}/api/status`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      const detailedStatus = await statusResponse.json();

      const statusElement = document.getElementById("apiStatus");
      const statusDot = statusElement.querySelector(".status-dot");
      const statusText = statusElement.querySelector(".status-text");

      console.log("Health Status:", healthStatus);
      console.log("API Status:", detailedStatus);

      // Check if all required APIs are configured
      const requiredAPIs = detailedStatus.api_keys;
      const criticalAPIs = ["google_places"]; // At minimum, Google Places is required
      const allCriticalReady = criticalAPIs.every(
        (api) => requiredAPIs[api] === true
      );

      if (detailedStatus.configuration_complete && allCriticalReady) {
        statusDot.className = "status-dot status-dot--success";
        statusText.textContent = "All APIs Ready";
      } else if (allCriticalReady) {
        statusDot.className = "status-dot status-dot--warning";
        statusText.textContent = "Core APIs Ready";
      } else {
        statusDot.className = "status-dot status-dot--warning";
        statusText.textContent = "APIs Not Fully Configured";
      }
    } catch (error) {
      console.error("API status check failed:", error);
      const statusElement = document.getElementById("apiStatus");
      const statusDot = statusElement.querySelector(".status-dot");
      const statusText = statusElement.querySelector(".status-text");

      statusDot.className = "status-dot status-dot--error";
      statusText.textContent = "API Connection Failed";
    }
  }

  initBusinessCategories() {
    const categorySelect = document.getElementById("categorySelect");
    const typeSelect = document.getElementById("typeSelect");

    // Populate categories
    const categories = window.BusinessCategories.getCategories();
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });

    // Handle category change
    categorySelect.addEventListener("change", (e) => {
      const selectedCategory = e.target.value;
      typeSelect.innerHTML = "";

      if (selectedCategory) {
        const types =
          window.BusinessCategories.getTypesForCategory(selectedCategory);
        typeSelect.disabled = false;

        types.forEach((type) => {
          const option = document.createElement("option");
          option.value = type;
          option.textContent = type;
          typeSelect.appendChild(option);
        });
      } else {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Select category first...";
        typeSelect.appendChild(option);
        typeSelect.disabled = true;
      }
    });
  }

  bindEvents() {
    // Logo click to go home
    const logoLink = document.getElementById("logoLink");
    if (logoLink) {
      logoLink.addEventListener("click", () => this.goHome());
    }

    // Settings button
    const settingsBtn = document.getElementById("settingsBtn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => this.showSettings());
    }

    // Back from settings
    const backFromSettings = document.getElementById("backFromSettings");
    if (backFromSettings) {
      backFromSettings.addEventListener("click", () => this.goHome());
    }

    // Save settings
    const saveSettings = document.getElementById("saveSettings");
    if (saveSettings) {
      saveSettings.addEventListener("click", () => this.saveAdminSettings());
    }

    // Template tile clicks
    const localBusinessCard = document.getElementById("localBusinessCard");
    if (localBusinessCard) {
      localBusinessCard.addEventListener("click", () =>
        this.selectTemplate("local-business")
      );
    }

    // Form submission (only bind if form exists)
    const searchForm = document.getElementById("searchForm");
    if (searchForm) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSearch();
      });
    }

    // Quantity button selection
    const quantityButtons = document.querySelectorAll(".quantity-btn");
    quantityButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        // Remove selected class from all buttons
        quantityButtons.forEach((b) => b.classList.remove("selected"));
        // Add selected class to clicked button
        btn.classList.add("selected");
        // Update selected quantity
        this.selectedQuantity = parseInt(btn.dataset.value);
        // Update cost estimate
        this.updateCostEstimate();
      });
    });
  }

  updateCostEstimate() {
    const leadCount = this.selectedQuantity || 5;
    const estimatedCost = (leadCount * this.costPerLead).toFixed(2);
    const costElement = document.getElementById("costEstimate");
    if (costElement) {
      costElement.textContent = `$${estimatedCost}`;
    }
  }

  async handleSearch() {
    // Prevent simultaneous campaigns
    if (this.campaignRunning) {
      alert(
        "A campaign is already running. Please wait for it to complete before starting a new one."
      );
      return;
    }

    const categorySelect = document.getElementById("categorySelect");
    const typeSelect = document.getElementById("typeSelect");
    const locationInput = document.getElementById("locationInput");
    const radiusSelect = document.getElementById("radiusSelect");
    const sizeSelect = document.getElementById("sizeSelect");

    // Get form values
    const category = categorySelect.value;
    const selectedTypes = Array.from(typeSelect.selectedOptions).map(
      (option) => option.value
    );
    const selectedSizes = Array.from(sizeSelect.selectedOptions).map(
      (option) => option.value
    );
    const businessTypes = selectedTypes.map((displayType) =>
      window.BusinessCategories.getRawTypeForDisplay(displayType)
    );
    const location = locationInput.value.trim();
    const radius = parseInt(radiusSelect.value);
    const leadCount = this.selectedQuantity || 5;

    // Validate form
    if (!category || selectedTypes.length === 0 || !location) {
      alert(
        "Please fill in all required fields and select at least one business type"
      );
      return;
    }

    console.log(
      `🔍 Starting business discovery: "${businessTypes.join(
        ", "
      )}" in "${location}" (${radius} miles, ${leadCount} leads)`
    );

    // Start campaign
    this.campaignRunning = true;
    this.showCampaignProgress(true);

    try {
      // Call the API with multiple business types
      const response = await fetch(`${this.baseUrl}/api/business/discover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          query: businessTypes.join(", "), // Join multiple types
          businessTypes: businessTypes, // Send as array too
          businessSizes: selectedSizes, // Send selected sizes
          location: location,
          radius: radius,
          count: leadCount,
          category: category,
        }),
      });

      if (!response.ok) {
        // Handle insufficient results (206 Partial Content)
        if (response.status === 206) {
          const partialResult = await response.json();
          console.log("⚠️ Insufficient results:", partialResult);
          this.showInsufficientResults(partialResult);
          return;
        }
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("✅ API Response:", result);

      // Store results and campaign ID for export functionality
      this.searchResults = result.businesses || [];
      this.lastSearchCampaignId =
        result.campaign?.id || result.campaignId || null;
      this.lastSearchCampaignName =
        result.campaign?.name || result.campaignName || null;

      console.log("📊 Campaign tracking:", {
        campaignId: this.lastSearchCampaignId,
        campaignName: this.lastSearchCampaignName,
        resultsCount: this.searchResults.length,
      });

      this.showResults(result);
    } catch (error) {
      console.error("❌ Business discovery failed:", error);
      this.showError(`Business discovery failed: ${error.message}`);
    } finally {
      // End campaign
      this.campaignRunning = false;
      this.showCampaignProgress(false);
    }
  }

  showCampaignProgress(isRunning) {
    let progressIndicator = document.getElementById("campaignProgress");

    if (isRunning) {
      if (!progressIndicator) {
        // Create progress indicator
        const searchInterface = document.querySelector(".search-interface");
        progressIndicator = document.createElement("div");
        progressIndicator.id = "campaignProgress";
        progressIndicator.className = "campaign-progress";
        progressIndicator.innerHTML = `
                    <div class="progress-content">
                        <div class="progress-icon">🔄</div>
                        <div class="progress-text">
                            <h3>Campaign Running...</h3>
                            <p>Discovering businesses and extracting owner information</p>
                            <div class="progress-steps">
                                <span class="step active" id="step1">🔍 Searching</span>
                                <span class="step" id="step2">✅ Validating</span>
                                <span class="step" id="step3">👤 Finding Owners</span>
                                <span class="step" id="step4">📊 Compiling Results</span>
                            </div>
                        </div>
                    </div>
                `;
        searchInterface.appendChild(progressIndicator);
      }

      // Animate progress steps
      this.animateProgressSteps();
    } else {
      if (progressIndicator) {
        progressIndicator.remove();
      }
    }
  }

  animateProgressSteps() {
    const steps = ["step1", "step2", "step3", "step4"];
    let currentStep = 0;

    const interval = setInterval(() => {
      if (!this.campaignRunning) {
        clearInterval(interval);
        return;
      }

      // Remove active class from all steps
      steps.forEach((step) => {
        const element = document.getElementById(step);
        if (element) element.classList.remove("active");
      });

      // Add active class to current step
      const currentElement = document.getElementById(steps[currentStep]);
      if (currentElement) currentElement.classList.add("active");

      currentStep = (currentStep + 1) % steps.length;
    }, 2000);
  }

  setLoadingState(isLoading) {
    const searchButton = document.getElementById("searchButton");
    const btnText = searchButton.querySelector(".btn-text");
    const btnSpinner = searchButton.querySelector(".btn-spinner");

    if (isLoading) {
      searchButton.disabled = true;
      btnText.style.display = "none";
      btnSpinner.classList.remove("hidden");
    } else {
      searchButton.disabled = false;
      btnText.style.display = "inline";
      btnSpinner.classList.add("hidden");
    }
  }

  showResults(result) {
    const resultsSection = document.getElementById("resultsSection");
    const businesses = result.businesses || [];
    const stats = result.stats || {};
    const costs = result.costs || {};
    const performance = result.performance || {};

    // Store session stats for admin dashboard
    this.sessionStats = {
      stats: stats,
      costs: costs,
      performance: performance,
    };

    // Create enhanced results HTML with Phase 1 metrics
    resultsSection.innerHTML = `
            <div class="results-header">
                <h2>Business Discovery Results</h2>
                <p>Found ${
                  businesses.length
                } verified business leads with owner data</p>
                ${
                  costs.totalEstimated > 0
                    ? `
                    <div class="cost-summary">
                        <span class="cost-badge">💰 Total Cost: $${costs.totalEstimated.toFixed(
                          4
                        )}</span>
                        <span class="efficiency-badge">⚡ ${
                          costs.averagePerLead
                            ? "$" + costs.averagePerLead.toFixed(4)
                            : "$0.00"
                        } per lead</span>
                    </div>
                `
                    : ""
                }
            </div>

            <div class="results-stats">
                <div class="stat-item">
                    <div class="stat-value">${stats.returned || 0}</div>
                    <div class="stat-label">Results</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.withOwners || 0}</div>
                    <div class="stat-label">With Owners</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.withEmails || 0}</div>
                    <div class="stat-label">With Emails</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${
                      stats.withVerifiedEmails || 0
                    }</div>
                    <div class="stat-label">Verified Emails</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${
                      performance.qualityDistribution?.A || 0
                    }</div>
                    <div class="stat-label">Grade A</div>
                </div>
            </div>

            <div class="results-grid">
                ${businesses
                  .map((business) => this.createEnhancedBusinessCard(business))
                  .join("")}
            </div>

            ${
              businesses.length > 0
                ? `
                <div class="export-section">
                    <h3>Export Your Verified Leads</h3>
                    <p>Download your verified business leads with owner contact information</p>
                    <div class="results-actions">
                        <button class="btn btn-outline" id="newSearchResultsBtn">
                            ← New Search
                        </button>
                        <button class="btn btn-primary" id="exportResultsBtn">
                            📄 Export to CSV
                        </button>
                    </div>
                </div>
            `
                : ""
            }
        `;

    resultsSection.classList.remove("hidden");

    // Bind the result action buttons
    this.bindResultButtons();
  }

  bindResultButtons() {
    const newSearchBtn = document.getElementById("newSearchResultsBtn");
    const exportBtn = document.getElementById("exportResultsBtn");

    if (newSearchBtn) {
      newSearchBtn.addEventListener("click", () => this.goHome());
    }

    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.exportResults());
    }
  }

  createEnhancedBusinessCard(business) {
    const hasOwnerInfo = business.ownerName || business.ownerEmail;
    const qualityGrade = business.qualityGrade || "F";
    const confidence = business.confidence || 0;

    return `
            <div class="business-list-item ${qualityGrade.toLowerCase()}-grade">
                <div class="business-main-info">
                    <div class="business-header-inline">
                        <span class="business-name">${business.name}</span>
                        <div class="quality-badges">
                            <span class="grade-badge grade-${qualityGrade.toLowerCase()}">${qualityGrade}</span>
                            ${
                              confidence > 0
                                ? `<span class="confidence-badge">${confidence}%</span>`
                                : ""
                            }
                            ${
                              business.emailVerification?.isValid
                                ? `<span class="verified-badge">✅</span>`
                                : ""
                            }
                        </div>
                    </div>
                    
                    <div class="business-details">
                        <div class="address-line">📍 ${
                          business.address || "No address available"
                        }</div>
                        
                        <div class="contact-details">
                            ${
                              business.phone
                                ? `<span class="contact-item">📞 <a href="tel:${business.phone}">${business.phone}</a></span>`
                                : ""
                            }
                            ${
                              business.website
                                ? `<span class="contact-item">🌐 <a href="${business.website}" target="_blank">Website</a></span>`
                                : ""
                            }
                            ${
                              business.rating
                                ? `<span class="contact-item">⭐ ${business.rating}/5</span>`
                                : ""
                            }
                        </div>
                        
                        ${
                          hasOwnerInfo
                            ? `
                            <div class="owner-details">
                                <span class="owner-label">👤 Owner:</span>
                                ${
                                  business.ownerName
                                    ? `<span class="owner-name">${
                                        business.ownerName
                                      }${
                                        business.ownerTitle
                                          ? ` (${business.ownerTitle})`
                                          : ""
                                      }</span>`
                                    : ""
                                }
                                ${
                                  business.ownerEmail
                                    ? `
                                    <span class="owner-email">
                                        📧 <a href="mailto:${
                                          business.ownerEmail
                                        }">${business.ownerEmail}</a>
                                        ${
                                          business.emailVerification
                                            ? `
                                            <span class="verification-inline ${
                                              business.emailVerification.isValid
                                                ? "valid"
                                                : "invalid"
                                            }">
                                                ${
                                                  business.emailVerification
                                                    .isValid
                                                    ? "✅"
                                                    : "❌"
                                                } ${
                                                business.emailVerification
                                                  .confidence
                                              }%
                                            </span>
                                        `
                                            : ""
                                        }
                                    </span>
                                `
                                    : ""
                                }
                                ${
                                  business.ownerPhone
                                    ? `<span class="owner-phone">📞 <a href="tel:${business.ownerPhone}">${business.ownerPhone}</a></span>`
                                    : ""
                                }
                                ${
                                  business.ownerLinkedIn
                                    ? `<span class="owner-linkedin">💼 <a href="${business.ownerLinkedIn}" target="_blank">LinkedIn</a></span>`
                                    : ""
                                }
                            </div>
                        `
                            : `
                            <div class="no-owner-info">
                                <span class="no-data-badge">👤 No owner data available</span>
                            </div>
                        `
                        }
                    </div>
                </div>

                ${
                  business.sources && business.sources.length > 0
                    ? `
                    <div class="business-meta">
                        <small class="sources-info">📊 ${this.formatSources(
                          business.sources
                        ).join(", ")}</small>
                    </div>
                `
                    : ""
                }
            </div>
        `;
  }

  // Helper method to format source names for display
  formatSources(sources) {
    const sourceMap = {
      website_scraping: "Website",
      whois: "WHOIS",
      state_registries: "State Registry",
      opencorporates: "OpenCorporates",
      hunter_io: "Hunter.io",
      neverbounce: "NeverBounce",
      business_directories: "Directories",
      google_places: "Google Places",
      yellow_pages: "Yellow Pages",
    };

    return sources.map((source) => sourceMap[source] || source);
  }

  createBusinessCard(business) {
    // Keep the legacy method for backward compatibility
    return this.createEnhancedBusinessCard(business);
  }

  showInsufficientResults(result) {
    const resultsSection = document.getElementById("resultsSection");
    const businesses = result.businesses || [];
    const stats = result.stats || {};

    resultsSection.innerHTML = `
            <div class="insufficient-results">
                <div class="insufficient-header">
                    <h2>⚠️ Insufficient Results Found</h2>
                    <p><strong>${
                      stats.preValidated || 0
                    }</strong> unique businesses found, but <strong>${
      stats.requested || 0
    }</strong> were requested</p>
                </div>

                <div class="suggestions-card">
                    <h3>💡 Suggestions to Get More Results</h3>
                    <ul class="suggestions-list">
                        ${result.suggestions
                          .map((suggestion) => `<li>${suggestion}</li>`)
                          .join("")}
                    </ul>
                </div>

                <div class="partial-results">
                    <h3>Available Results (${businesses.length})</h3>
                    <div class="results-grid">
                        ${businesses
                          .map((business) => this.createBusinessCard(business))
                          .join("")}
                    </div>
                </div>

                <div class="insufficient-actions">
                    <button class="btn btn-outline" id="adjustSearchBtn">
                        🔧 Adjust Search Parameters
                    </button>
                    ${
                      businesses.length > 0
                        ? `
                        <button class="btn btn-secondary" id="proceedAnywayBtn">
                            ✅ Proceed with ${businesses.length} Results
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
        `;

    resultsSection.classList.remove("hidden");

    // Bind action buttons
    const adjustBtn = document.getElementById("adjustSearchBtn");
    const proceedBtn = document.getElementById("proceedAnywayBtn");

    if (adjustBtn) {
      adjustBtn.addEventListener("click", () => {
        // Scroll back to search form and highlight suggestions
        document
          .querySelector(".search-interface")
          .scrollIntoView({ behavior: "smooth" });
        this.highlightSearchSuggestions();
      });
    }

    if (proceedBtn) {
      proceedBtn.addEventListener("click", () => {
        // Store partial results and show them as normal results
        this.searchResults = businesses;
        this.showResults({
          businesses: businesses,
          stats: stats,
          partial: true,
        });
      });
    }
  }

  highlightSearchSuggestions() {
    // Temporarily highlight form elements that could help get more results
    const radiusSelect = document.getElementById("radiusSelect");
    const typeSelect = document.getElementById("typeSelect");

    [radiusSelect, typeSelect].forEach((element) => {
      if (element) {
        element.style.borderColor = "#f59e0b";
        element.style.boxShadow = "0 0 0 3px rgba(245, 158, 11, 0.2)";

        setTimeout(() => {
          element.style.borderColor = "";
          element.style.boxShadow = "";
        }, 3000);
      }
    });
  }

  showError(message) {
    const resultsSection = document.getElementById("resultsSection");
    resultsSection.innerHTML = `
            <div class="error-message">
                <h3>Discovery Failed</h3>
                <p>${message}</p>
                <p>This system only returns real data from actual APIs. If discovery fails, no fake data will be generated.</p>
                <button class="btn btn-secondary" onclick="document.getElementById('resultsSection').classList.add('hidden')">
                    Try Again
                </button>
            </div>
        `;
    resultsSection.classList.remove("hidden");
  }

  exportResults() {
    console.log("Export function called");
    console.log("Search results:", this.searchResults);

    if (this.searchResults.length === 0) {
      alert("No data to export");
      return;
    }

    try {
      // Enhanced CSV headers with all Phase 1 data fields
      const headers = [
        "Business Name",
        "Address",
        "Business Phone",
        "Website",
        "Business Rating",
        "Owner Name",
        "Owner Title",
        "Owner Email",
        "Owner Phone",
        "Owner LinkedIn",
        "Email Verification Status",
        "Email Verification Confidence",
        "Overall Confidence Score",
        "Quality Grade",
        "Data Sources",
        "Incorporation State",
        "API Cost",
        "Pre-validation Score",
      ];

      const csvContent = [
        headers.join(","),
        ...this.searchResults.map((business) => {
          return [
            `"${business.name || ""}"`,
            `"${business.address || ""}"`,
            `"${business.phone || ""}"`,
            `"${business.website || ""}"`,
            `"${business.rating || ""}"`,
            `"${business.ownerName || ""}"`,
            `"${business.ownerTitle || ""}"`,
            `"${business.ownerEmail || ""}"`,
            `"${business.ownerPhone || ""}"`,
            `"${business.ownerLinkedIn || ""}"`,
            `"${
              business.emailVerification?.isValid
                ? "Valid"
                : business.emailVerification
                ? "Invalid"
                : "Not Checked"
            }"`,
            `"${business.emailVerification?.confidence || 0}%"`,
            `"${business.confidence || 0}%"`,
            `"${business.qualityGrade || "F"}"`,
            `"${
              business.sources
                ? this.formatSources(business.sources).join("; ")
                : ""
            }"`,
            `"${business.incorporationState || ""}"`,
            `"$${
              business.actualCost ? business.actualCost.toFixed(4) : "0.0000"
            }"`,
            `"${business.preValidationScore || 0}%"`,
          ].join(",");
        }),
      ].join("\n");

      console.log(
        "Enhanced CSV content generated:",
        csvContent.substring(0, 200) + "..."
      );

      // Download CSV with enhanced filename
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:-]/g, "");
      link.href = URL.createObjectURL(blob);
      link.download = `ProspectPro_Enhanced_Leads_${timestamp}.csv`;
      link.click();

      console.log("CSV export completed successfully");
    } catch (error) {
      console.error("CSV export failed:", error);
      alert("Failed to export CSV. Please try again.");
    }
  }

  // Settings Management
  initializeSettingsHandlers() {
    // Load saved configuration
    this.loadConfiguration();

    // Grafana Dashboard Link Handler
    const grafanaLink = document.getElementById("grafanaLink");
    const grafanaUrl = document.getElementById("grafanaUrl");

    // Update Grafana link when URL changes
    grafanaUrl.addEventListener("change", () => {
      const url = grafanaUrl.value.trim();
      if (url) {
        grafanaLink.href = url;
        grafanaLink.style.display = "inline-block";
      } else {
        grafanaLink.href = "#";
        grafanaLink.style.display = "none";
      }
    });

    // Configuration Save Handler
    document.getElementById("saveAllSettings").addEventListener("click", () => {
      this.saveConfiguration();
    });

    // Reset to Defaults Handler
    document.getElementById("resetToDefaults").addEventListener("click", () => {
      this.resetConfiguration();
    });

    // Export Handlers
    document
      .getElementById("exportCampaignData")
      .addEventListener("click", async () => {
        // Check if we have a current campaign from search results
        if (this.lastSearchCampaignId) {
          try {
            console.log(
              `📤 Exporting specific campaign: ${this.lastSearchCampaignName} (${this.lastSearchCampaignId})`
            );
            await this.exportCampaignLeads(this.lastSearchCampaignId, {
              minConfidence: 70,
              includeProvenance: true,
            });
          } catch (error) {
            console.error(
              "Campaign export failed, falling back to dashboard export:",
              error
            );
            this.exportDashboardData("campaign");
          }
        } else {
          console.log(
            "📊 No specific campaign available, exporting all campaign data"
          );
          // Fall back to general dashboard export
          this.exportDashboardData("campaign");
        }
      });

    document
      .getElementById("exportCostAnalysis")
      .addEventListener("click", () => {
        this.exportDashboardData("cost");
      });

    document.getElementById("exportROIReport").addEventListener("click", () => {
      this.exportDashboardData("roi");
    });

    // Test Dashboard Connection
    document
      .getElementById("testDashboardConnection")
      .addEventListener("click", () => {
        this.testDashboardConnection();
      });
  }

  loadConfiguration() {
    const config = JSON.parse(
      localStorage.getItem("prospectpro_config") || "{}"
    );

    // Load cost and usage limits
    document.getElementById("dailyCostLimit").value =
      config.dailyCostLimit || "50.00";
    document.getElementById("costPerLeadLimit").value =
      config.costPerLeadLimit || "2.00";
    document.getElementById("qualificationRateAlert").value =
      config.qualificationRateAlert || "70";
    document.getElementById("maxLeadsPerCampaign").value =
      config.maxLeadsPerCampaign || "50";

    // Load campaign settings
    document.getElementById("confidenceThreshold").value =
      config.confidenceThreshold || "80";
    document.getElementById("emailVerificationEnabled").checked =
      config.emailVerificationEnabled !== false;
    document.getElementById("websiteValidationEnabled").checked =
      config.websiteValidationEnabled !== false;
    document.getElementById("socialProfilesEnabled").checked =
      config.socialProfilesEnabled || false;

    // Load monitoring configuration
    document.getElementById("grafanaUrl").value = config.grafanaUrl || "";
    document.getElementById("metricsCollectionInterval").value =
      config.metricsCollectionInterval || "60";
    document.getElementById("healthCheckInterval").value =
      config.healthCheckInterval || "300";
    document.getElementById("enableRealTimeUpdates").checked =
      config.enableRealTimeUpdates !== false;

    // Update Grafana link
    const grafanaUrl = config.grafanaUrl || "";
    const grafanaLink = document.getElementById("grafanaLink");
    if (grafanaUrl) {
      grafanaLink.href = grafanaUrl;
      grafanaLink.style.display = "inline-block";
    } else {
      grafanaLink.href = "#";
      grafanaLink.onclick = (e) => {
        e.preventDefault();
        alert(
          "Please configure your Grafana URL in the monitoring settings below."
        );
      };
    }
  }

  saveConfiguration() {
    const config = {
      // Cost and usage limits
      dailyCostLimit: document.getElementById("dailyCostLimit").value,
      costPerLeadLimit: document.getElementById("costPerLeadLimit").value,
      qualificationRateAlert: document.getElementById("qualificationRateAlert")
        .value,
      maxLeadsPerCampaign: document.getElementById("maxLeadsPerCampaign").value,

      // Campaign settings
      confidenceThreshold: document.getElementById("confidenceThreshold").value,
      emailVerificationEnabled: document.getElementById(
        "emailVerificationEnabled"
      ).checked,
      websiteValidationEnabled: document.getElementById(
        "websiteValidationEnabled"
      ).checked,
      socialProfilesEnabled: document.getElementById("socialProfilesEnabled")
        .checked,

      // Monitoring configuration
      grafanaUrl: document.getElementById("grafanaUrl").value,
      metricsCollectionInterval: document.getElementById(
        "metricsCollectionInterval"
      ).value,
      healthCheckInterval: document.getElementById("healthCheckInterval").value,
      enableRealTimeUpdates: document.getElementById("enableRealTimeUpdates")
        .checked,

      // Save timestamp
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem("prospectpro_config", JSON.stringify(config));

    // Show success message
    const saveButton = document.getElementById("saveAllSettings");
    const originalText = saveButton.textContent;
    saveButton.textContent = "✅ Configuration Saved!";
    saveButton.style.backgroundColor = "#10b981";

    setTimeout(() => {
      saveButton.textContent = originalText;
      saveButton.style.backgroundColor = "";
    }, 2000);

    console.log("Configuration saved:", config);
  }

  resetConfiguration() {
    if (
      confirm(
        "This will reset all configuration to default values. Are you sure?"
      )
    ) {
      localStorage.removeItem("prospectpro_config");
      this.loadConfiguration();

      const resetButton = document.getElementById("resetToDefaults");
      const originalText = resetButton.textContent;
      resetButton.textContent = "🔄 Reset Complete!";

      setTimeout(() => {
        resetButton.textContent = originalText;
      }, 2000);
    }
  }

  async exportDashboardData(type) {
    try {
      const endpoint = {
        campaign: "/api/dashboard/export/campaign-performance",
        cost: "/api/dashboard/export/cost-analysis",
        roi: "/api/dashboard/export/roi-reports",
      }[type];

      if (!endpoint) {
        throw new Error("Invalid export type");
      }

      const response = await fetch(`${this.baseUrl}${endpoint}?format=csv`);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:-]/g, "");
      link.href = url;
      link.download = `ProspectPro_${type}_export_${timestamp}.csv`;
      link.click();

      window.URL.revokeObjectURL(url);

      console.log(`${type} export completed successfully`);
    } catch (error) {
      console.error(`${type} export failed:`, error);
      alert(`Failed to export ${type} data. Please try again.`);
    }
  }

  /**
   * Export specific campaign leads to CSV
   */
  async exportCampaignLeads(campaignId, options = {}) {
    try {
      const {
        minConfidence = 70,
        includeUnqualified = false,
        includeProvenance = true,
      } = options;

      console.log(`📤 Exporting campaign ${campaignId}...`);

      const params = new URLSearchParams({
        format: "csv",
        minConfidence: minConfidence.toString(),
        includeUnqualified: includeUnqualified.toString(),
        includeProvenance: includeProvenance.toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/api/campaigns/${campaignId}/export?${params}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Export failed: ${response.statusText}`
        );
      }

      // Get export metadata from headers
      const exportCount = response.headers.get("X-Export-Count");
      const totalCount = response.headers.get("X-Total-Count");
      const campaignName = response.headers.get("X-Campaign-Name");

      // Download the CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${campaignName}_${campaignId.slice(
        0,
        8
      )}_${timestamp}.csv`;

      link.href = url;
      link.download = filename;
      link.click();

      window.URL.revokeObjectURL(url);

      console.log(
        `✅ Campaign export completed: ${exportCount}/${totalCount} leads exported`
      );

      // Show success notification
      this.showNotification(
        `✅ Exported ${exportCount}/${totalCount} leads from "${campaignName}"`,
        "success"
      );

      return {
        success: true,
        exportCount: parseInt(exportCount),
        totalCount: parseInt(totalCount),
        campaignName,
        filename,
      };
    } catch (error) {
      console.error("❌ Campaign export failed:", error);
      this.showNotification(`❌ Export failed: ${error.message}`, "error");
      throw error;
    }
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = "info") {
    // Create notification element if it doesn't exist
    let notification = document.getElementById("notification");
    if (!notification) {
      notification = document.createElement("div");
      notification.id = "notification";
      notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
      document.body.appendChild(notification);
    }

    // Set notification style based on type
    const colors = {
      success: "#10B981",
      error: "#EF4444",
      warning: "#F59E0B",
      info: "#3B82F6",
    };

    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.display = "block";

    // Auto-hide after 5 seconds
    setTimeout(() => {
      notification.style.display = "none";
    }, 5000);
  }

  async testDashboardConnection() {
    const button = document.getElementById("testDashboardConnection");
    const originalText = button.textContent;

    button.textContent = "🔍 Testing...";
    button.disabled = true;

    try {
      const grafanaUrl = document.getElementById("grafanaUrl").value;

      if (!grafanaUrl) {
        throw new Error("Please configure Grafana URL first");
      }

      // Test basic connectivity
      const response = await fetch(
        `${this.baseUrl}/api/dashboard/health-check`
      );
      const healthData = await response.json();

      if (response.ok) {
        button.textContent = "✅ Connection OK!";
        button.style.backgroundColor = "#10b981";
        console.log("Dashboard connection test successful:", healthData);

        // Show detailed status
        alert(`Dashboard Connection Test Results:
- Database: ${healthData.database ? "✅ Connected" : "❌ Failed"}
- API Endpoints: ${healthData.apiEndpoints ? "✅ Available" : "❌ Unavailable"}
- Monitoring: ${healthData.monitoring ? "✅ Active" : "❌ Inactive"}
- Last Update: ${new Date(healthData.timestamp).toLocaleString()}`);
      } else {
        throw new Error(
          `Health check failed: ${healthData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Dashboard connection test failed:", error);
      button.textContent = "❌ Connection Failed";
      button.style.backgroundColor = "#ef4444";
      alert(`Dashboard connection test failed: ${error.message}`);
    } finally {
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = "";
        button.disabled = false;
      }, 3000);
    }
  }

  updateSessionStats() {
    // Update session stats in settings page
    const stats = this.searchResults
      ? {
          leads: this.searchResults.length,
          qualified: this.searchResults.filter((b) => b.confidence >= 70)
            .length,
          cost: this.searchResults.reduce(
            (sum, b) => sum + (b.actualCost || 0),
            0
          ),
        }
      : { leads: 0, qualified: 0, cost: 0 };

    const sessionLeadsEl = document.getElementById("sessionLeads");
    const sessionCostEl = document.getElementById("sessionCost");
    const sessionQualificationEl = document.getElementById(
      "sessionQualification"
    );
    const sessionEfficiencyEl = document.getElementById("sessionEfficiency");

    if (sessionLeadsEl) sessionLeadsEl.textContent = stats.leads;
    if (sessionCostEl) sessionCostEl.textContent = `$${stats.cost.toFixed(2)}`;
    if (sessionQualificationEl) {
      const rate =
        stats.leads > 0
          ? ((stats.qualified / stats.leads) * 100).toFixed(1)
          : "0";
      sessionQualificationEl.textContent = `${rate}%`;
    }
    if (sessionEfficiencyEl) {
      const efficiency =
        stats.qualified > 0 ? (stats.cost / stats.qualified).toFixed(2) : "-";
      sessionEfficiencyEl.textContent =
        stats.qualified > 0 ? `$${efficiency}` : "-";
    }
  }
}

// Initialize the application
let prospectProApp;
document.addEventListener("DOMContentLoaded", () => {
  prospectProApp = new ProspectProRealAPI();

  // Initialize settings handlers
  setTimeout(() => {
    if (prospectProApp.initializeSettingsHandlers) {
      prospectProApp.initializeSettingsHandlers();
    }
  }, 100);
});
