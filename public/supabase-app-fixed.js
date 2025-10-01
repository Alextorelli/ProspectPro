// ProspectPro Supabase-First Frontend - Fixed Version
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

class ProspectProSupabase {
  constructor() {
    console.log("🔧 ProspectPro initializing with all fixes...");

    // Enhanced error tracking
    window.addEventListener("error", (e) => {
      console.error("🚨 Global JavaScript Error:", e.error);
      console.error("📍 File:", e.filename, "Line:", e.lineno);
    });

    window.addEventListener("unhandledrejection", (e) => {
      console.error("🚨 Unhandled Promise Rejection:", e.reason);
    });

    try {
      // Initialize Supabase client
      this.supabase = createClient(
        "https://sriycekxdqnesdsgwiuc.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjU3ODksImV4cCI6MjA3MzU0MTc4OX0.Rx_1Hjz2eayKie0RpPB28i7_683ZwhVJ_5Eu_rzTWpI"
      );

      console.log("✅ Supabase client created successfully");
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
    this.costPerLead = 0.14;
    this.campaignRunning = false;
    this.currentPage = "discovery";

    // Business taxonomy for cascading dropdowns
    this.businessTaxonomy = {
      "Professional Services": [
        "accounting",
        "lawyer",
        "attorney",
        "consultant",
        "real estate agency",
        "insurance agency",
        "corporate office",
        "business center",
        "financial advisor",
        "tax preparation",
        "notary",
        "employment agency",
        "marketing agency",
        "advertising agency",
        "architecture firm",
        "engineering office",
        "recruiter",
      ],
      "Financial Services": [
        "bank",
        "credit union",
        "ATM",
        "mortgage broker",
        "investment firm",
        "stock broker",
        "cryptocurrency exchange",
        "check cashing service",
        "money transfer service",
        "payday lender",
        "financial planner",
      ],
      "Healthcare & Medical": [
        "doctor",
        "dentist",
        "hospital",
        "pharmacy",
        "drugstore",
        "chiropractor",
        "physiotherapist",
        "dental clinic",
        "medical lab",
        "veterinary care",
        "wellness center",
        "skin care clinic",
        "optical clinic",
        "mental health clinic",
        "urgent care",
        "medical center",
        "health insurance office",
        "medical equipment supplier",
        "optometrist",
        "orthodontist",
        "psychologist",
        "psychiatrist",
        "acupuncture clinic",
        "physical therapy",
        "occupational therapist",
        "speech therapist",
      ],
      "Personal Care & Beauty": [
        "hair salon",
        "hair care",
        "beauty salon",
        "barber shop",
        "nail salon",
        "spa",
        "massage",
        "beautician",
        "makeup artist",
        "body art service",
        "tanning studio",
        "sauna",
        "tattoo parlor",
        "piercing shop",
        "waxing salon",
        "eyebrow threading",
        "cosmetics store",
        "day spa",
        "facial spa",
      ],
      "Home & Property Services": [
        "electrician",
        "plumber",
        "painter",
        "roofing contractor",
        "general contractor",
        "locksmith",
        "moving company",
        "laundry",
        "dry cleaning",
        "storage",
        "HVAC contractor",
        "landscaping",
        "pest control",
        "cleaning service",
        "home inspector",
        "flooring contractor",
        "handyman",
        "property management",
        "gardener",
        "pool service",
        "window cleaning",
        "carpet cleaning",
        "appliance repair",
        "fence contractor",
        "gutter service",
      ],
      "Automotive Services": [
        "car repair",
        "car wash",
        "car dealer",
        "car rental",
        "gas station",
        "electric vehicle charging station",
        "auto parts store",
        "tire shop",
        "auto body shop",
        "motorcycle dealer",
        "truck dealer",
        "RV dealer",
        "automotive glass service",
        "oil change service",
        "towing service",
        "auto detailing",
        "smog check station",
        "transmission shop",
      ],
      "Food & Dining": [
        "restaurant",
        "cafe",
        "bakery",
        "bar",
        "fast food restaurant",
        "pizza restaurant",
        "chinese restaurant",
        "mexican restaurant",
        "italian restaurant",
        "japanese restaurant",
        "indian restaurant",
        "meal delivery",
        "meal takeaway",
        "catering service",
        "pub",
        "wine bar",
        "cocktail bar",
        "coffee shop",
        "ice cream shop",
        "food court",
        "donut shop",
        "deli",
        "steakhouse",
        "sushi restaurant",
        "seafood restaurant",
        "burger joint",
        "taco place",
        "food truck",
        "brewery",
        "distillery",
        "winery",
        "juice bar",
        "smoothie shop",
        "tea house",
        "dessert shop",
        "sandwich shop",
        "barbecue restaurant",
        "brunch restaurant",
        "buffet",
        "food stand",
      ],
      "Retail & Shopping": [
        "clothing store",
        "shoe store",
        "electronics store",
        "furniture store",
        "home goods store",
        "jewelry store",
        "book store",
        "gift shop",
        "department store",
        "shopping mall",
        "supermarket",
        "grocery store",
        "convenience store",
        "pet store",
        "sporting goods store",
        "bicycle store",
        "toy store",
        "hardware store",
        "garden center",
        "liquor store",
        "music store",
        "art supply store",
        "office supply store",
        "optical store",
        "antique shop",
        "thrift store",
        "hobby shop",
        "vape shop",
        "tobacco shop",
        "florist",
        "craft store",
        "party supply store",
        "dollar store",
        "discount store",
        "outlet store",
        "boutique",
        "second hand store",
      ],
      "Technology & IT Services": [
        "cell phone store",
        "telecommunications service provider",
        "internet cafe",
        "computer repair",
        "IT services",
        "software company",
        "data center",
        "co-working space",
        "tech support",
        "web design",
        "app development",
        "cybersecurity firm",
        "managed services provider",
      ],
      "Education & Training": [
        "school",
        "university",
        "primary school",
        "secondary school",
        "preschool",
        "library",
        "summer camp organizer",
        "tutoring center",
        "vocational school",
        "college",
        "driving school",
        "language school",
        "music school",
        "art school",
        "dance studio",
        "cooking school",
        "training center",
        "daycare",
        "kindergarten",
        "charter school",
        "private school",
        "public school",
        "community college",
        "technical school",
      ],
      "Entertainment & Recreation": [
        "event venue",
        "wedding venue",
        "banquet hall",
        "movie theater",
        "bowling alley",
        "amusement park",
        "casino",
        "night club",
        "tourist attraction",
        "museum",
        "zoo",
        "aquarium",
        "park",
        "sports complex",
        "gym",
        "fitness center",
        "yoga studio",
        "golf course",
        "tennis court",
        "swimming pool",
        "arcade",
        "karaoke venue",
        "comedy club",
        "theater",
        "concert hall",
        "art gallery",
        "botanical garden",
        "beach",
        "ski resort",
        "marina",
        "stadium",
        "arena",
        "convention center",
        "escape room",
        "paintball",
        "trampoline park",
        "mini golf",
        "rock climbing gym",
      ],
      "Hospitality & Lodging": [
        "hotel",
        "motel",
        "resort",
        "bed and breakfast",
        "hostel",
        "vacation rental",
        "campground",
        "RV park",
        "inn",
        "lodge",
        "extended stay hotel",
        "boutique hotel",
        "guest house",
      ],
      "Transportation & Transit": [
        "airport",
        "train station",
        "bus station",
        "subway station",
        "taxi stand",
        "parking lot",
        "parking garage",
        "ferry terminal",
        "bike rental",
        "scooter rental",
        "limousine service",
        "shuttle service",
        "travel agency",
        "bus tour agency",
        "cruise agency",
        "car sharing",
        "ride share location",
        "truck stop",
        "rest area",
      ],
      "Religious & Community": [
        "church",
        "mosque",
        "synagogue",
        "temple",
        "religious center",
        "community center",
        "non-profit organization",
        "social club",
        "civic organization",
        "funeral home",
        "cemetery",
        "crematorium",
        "place of worship",
        "spiritual center",
        "meditation center",
      ],
      "Government & Public Services": [
        "city hall",
        "courthouse",
        "police station",
        "fire station",
        "post office",
        "embassy",
        "consulate",
        "DMV",
        "public library",
        "public school",
        "government office",
        "social services office",
        "municipal building",
        "county office",
        "public works",
        "tax office",
        "passport office",
        "voter registration office",
      ],
    };

    this.initializeUI();
  }

  async testSupabaseClient() {
    try {
      console.log("🧪 Testing Supabase client connectivity...");
      if (!this.supabase.functions) {
        throw new Error("Supabase functions object is undefined");
      }
      console.log("✅ Supabase functions object exists");
      if (typeof this.supabase.functions.invoke !== "function") {
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
      this.setupBusinessTypeCascade();
      this.setupEnhancementControls();
      this.attachEventListeners();
      this.updateCost();
      this.showWelcomeMessage();
      console.log("✅ UI initialization complete");
    } catch (error) {
      console.error("🚨 UI initialization failed:", error);
    }
  }

  setupBusinessTypeCascade() {
    const categorySelect = document.getElementById("categorySelect");
    const businessTypeInput = document.getElementById("business-type");

    if (!categorySelect || !businessTypeInput) {
      console.error("❌ Category elements not found");
      return;
    }

    // Clear existing options
    categorySelect.innerHTML =
      '<option value="">Select Business Category</option>';

    // Add business categories
    Object.keys(this.businessTaxonomy).forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });

    // Create business type dropdown
    const businessTypeSelect = document.createElement("select");
    businessTypeSelect.id = "business-type-select";
    businessTypeSelect.style.width = "100%";
    businessTypeSelect.style.padding = "15px";
    businessTypeSelect.style.border = "2px solid #e1e5e9";
    businessTypeSelect.style.borderRadius = "10px";
    businessTypeSelect.style.fontSize = "1rem";
    businessTypeSelect.style.marginTop = "10px";
    businessTypeSelect.style.display = "none";
    businessTypeSelect.innerHTML =
      '<option value="">Select Business Type</option>';

    // Insert after the category select
    categorySelect.parentNode.insertBefore(
      businessTypeSelect,
      categorySelect.nextSibling
    );

    // Handle category change
    categorySelect.addEventListener("change", (e) => {
      const selectedCategory = e.target.value;
      businessTypeSelect.innerHTML =
        '<option value="">Select Business Type</option>';

      if (selectedCategory && this.businessTaxonomy[selectedCategory]) {
        this.businessTaxonomy[selectedCategory].forEach((businessType) => {
          const option = document.createElement("option");
          option.value = businessType;
          option.textContent = businessType;
          businessTypeSelect.appendChild(option);
        });
        businessTypeSelect.style.display = "block";
        businessTypeInput.style.display = "none";
      } else {
        businessTypeSelect.style.display = "none";
        businessTypeInput.style.display = "block";
      }

      // Clear business type input
      businessTypeInput.value = "";
      this.updateCost();
    });

    // Handle business type change
    businessTypeSelect.addEventListener("change", (e) => {
      businessTypeInput.value = e.target.value;
      this.updateCost();
    });

    // Allow manual entry toggle
    const manualEntryBtn = document.createElement("button");
    manualEntryBtn.type = "button";
    manualEntryBtn.textContent = "Enter Custom Business Type";
    manualEntryBtn.className = "btn-secondary";
    manualEntryBtn.style.marginTop = "10px";
    manualEntryBtn.addEventListener("click", () => {
      categorySelect.value = "";
      businessTypeSelect.style.display = "none";
      businessTypeInput.style.display = "block";
      businessTypeInput.focus();
    });

    businessTypeSelect.parentNode.insertBefore(
      manualEntryBtn,
      businessTypeSelect.nextSibling
    );
  }

  setupEnhancementControls() {
    console.log("🚀 Setting up enhancement controls...");

    const searchForm =
      document.querySelector("form") ||
      document.querySelector(".search-container");
    if (!searchForm) {
      console.warn("Search form not found for enhancement controls");
      return;
    }

    // Create enhancement options section
    const enhancementSection = document.createElement("div");
    enhancementSection.className = "enhancement-section";
    enhancementSection.innerHTML = `
      <div style="margin: 20px 0; padding: 15px; border: 2px solid #e1e5e9; border-radius: 10px; background: #f8f9fa;">
        <h3 style="margin: 0 0 15px 0; color: #495057; font-size: 1.1rem;">🚀 Enhanced Discovery Options</h3>
        
        <label style="display: flex; align-items: center; margin-bottom: 12px; cursor: pointer;">
          <input type="checkbox" id="enable-chamber" checked style="margin-right: 10px; transform: scale(1.2);">
          <span style="font-weight: 500;">Chamber of Commerce Verification</span>
          <span style="margin-left: auto; color: #28a745; font-weight: bold;">FREE</span>
        </label>
        
        <label style="display: flex; align-items: center; margin-bottom: 12px; cursor: pointer;">
          <input type="checkbox" id="enable-associations" checked style="margin-right: 10px; transform: scale(1.2);">
          <span style="font-weight: 500;">Trade Association Verification</span>
          <span style="margin-left: auto; color: #28a745; font-weight: bold;">FREE</span>
        </label>
        
        <label style="display: flex; align-items: center; margin-bottom: 15px; cursor: pointer;">
          <input type="checkbox" id="enable-apollo" style="margin-right: 10px; transform: scale(1.2);">
          <span style="font-weight: 500;">Apollo.io Owner Discovery</span>
          <span style="margin-left: auto; color: #007bff; font-weight: bold;">$1.00/org</span>
        </label>
        
        <div id="enhancement-cost-estimate" style="padding: 10px; border-radius: 5px; font-size: 0.9em; font-weight: 500;"></div>
      </div>
    `;

    // Find the best insertion point (before the start discovery button)
    const startButton = document.getElementById("start-discovery");
    if (startButton && startButton.parentNode) {
      startButton.parentNode.insertBefore(enhancementSection, startButton);
    } else {
      // Fallback: append to search form
      searchForm.appendChild(enhancementSection);
    }

    // Add event listeners for cost calculation
    const apolloCheckbox = document.getElementById("enable-apollo");
    const chamberCheckbox = document.getElementById("enable-chamber");
    const associationsCheckbox = document.getElementById("enable-associations");

    if (apolloCheckbox) {
      apolloCheckbox.addEventListener("change", () =>
        this.updateEnhancementEstimate()
      );
    }
    if (chamberCheckbox) {
      chamberCheckbox.addEventListener("change", () =>
        this.updateEnhancementEstimate()
      );
    }
    if (associationsCheckbox) {
      associationsCheckbox.addEventListener("change", () =>
        this.updateEnhancementEstimate()
      );
    }

    // Initial estimate
    this.updateEnhancementEstimate();

    console.log("✅ Enhancement controls setup completed");
  }

  updateEnhancementEstimate() {
    const apolloEnabled =
      document.getElementById("enable-apollo")?.checked || false;
    const chamberEnabled =
      document.getElementById("enable-chamber")?.checked || false;
    const associationsEnabled =
      document.getElementById("enable-associations")?.checked || false;
    const maxResults =
      parseInt(document.getElementById("quantity-input")?.value) || 10;
    const estimateDiv = document.getElementById("enhancement-cost-estimate");

    if (!estimateDiv) return;

    let message = "";
    let totalCost = 0;
    const enhancements = [];

    if (chamberEnabled) {
      enhancements.push("Chamber Verification");
    }

    if (associationsEnabled) {
      enhancements.push("Trade Associations");
    }

    if (apolloEnabled) {
      totalCost = maxResults * 1.0;
      enhancements.push("Apollo Owner Discovery");
    }

    if (enhancements.length === 0) {
      message = "❌ No enhancements selected - basic discovery only";
      estimateDiv.style.background = "#fff3cd";
      estimateDiv.style.color = "#856404";
    } else if (totalCost === 0) {
      message = `💰 Free enhanced discovery with: ${enhancements.join(", ")}`;
      estimateDiv.style.background = "#d4edda";
      estimateDiv.style.color = "#155724";
    } else {
      message = `📊 Enhanced discovery cost: $${totalCost.toFixed(
        2
      )} for ${maxResults} businesses<br>✅ Includes: ${enhancements.join(
        ", "
      )}`;
      estimateDiv.style.background = "#d1ecf1";
      estimateDiv.style.color = "#0c5460";
    }

    estimateDiv.innerHTML = message;
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
    }

    // Export Button
    const exportButton = document.getElementById("export-csv");
    if (exportButton) {
      exportButton.addEventListener("click", () => this.exportToCsv());
    }

    // Lead quantity buttons
    const quantityButtons = document.querySelectorAll(".lead-quantity-btn");
    const quantitySlider = document.getElementById("lead-quantity");
    const quantityDisplay = document.getElementById("lead-quantity-display");

    console.log(`🔢 Found ${quantityButtons.length} quantity buttons`);

    // Sync buttons with slider
    quantityButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = parseInt(btn.textContent);

        // Update button states
        document
          .querySelectorAll(".lead-quantity-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        // Update slider
        if (quantitySlider) {
          quantitySlider.value = value;
        }

        // Update display
        if (quantityDisplay) {
          quantityDisplay.textContent = `${value} leads`;
        }

        this.updateCost();
      });
    });

    // Sync slider with buttons
    if (quantitySlider && quantityDisplay) {
      quantitySlider.addEventListener("input", (e) => {
        const value = parseInt(e.target.value);

        // Update display
        quantityDisplay.textContent = `${value} leads`;

        // Update button states
        document.querySelectorAll(".lead-quantity-btn").forEach((btn) => {
          btn.classList.remove("active");
          if (parseInt(btn.textContent) === value) {
            btn.classList.add("active");
          }
        });

        this.updateCost();
        this.updateEnhancementEstimate();
      });
    }

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

  // Fixed page navigation methods
  showPage(pageId) {
    console.log(`📄 Switching to page: ${pageId}`);

    // Hide all pages
    const pages = ["discoveryPage", "settingsPage"];
    pages.forEach((id) => {
      const page = document.getElementById(id);
      if (page) {
        page.style.display = "none";
      }
    });

    // Show requested page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.style.display = "block";
      this.currentPage = pageId;

      // Load dashboard data if switching to settings
      if (pageId === "settingsPage") {
        this.loadDashboardData();
      }
    }
  }

  showSettings() {
    this.showPage("settingsPage");
  }

  async loadDashboardData() {
    console.log("📊 Loading dashboard data...");

    try {
      // Get campaign statistics
      const { data: campaigns, error: campaignError } = await this.supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (campaignError) {
        console.error("Dashboard data error:", campaignError);
        return;
      }

      // Get leads statistics
      const { data: leads, error: leadsError } = await this.supabase
        .from("leads")
        .select("*");

      if (leadsError) {
        console.error("Leads data error:", leadsError);
        return;
      }

      // Update dashboard cards
      const totalCampaigns = campaigns?.length || 0;
      const totalLeads = leads?.length || 0;
      const totalCost =
        campaigns?.reduce((sum, c) => sum + (c.total_cost || 0), 0) || 0;
      const avgConfidence = leads?.length
        ? leads.reduce((sum, l) => sum + (l.confidence_score || 0), 0) /
          leads.length
        : 0;

      // Update dashboard UI
      this.updateDashboardCard(
        "total-campaigns",
        totalCampaigns,
        "Total Campaigns"
      );
      this.updateDashboardCard("total-leads", totalLeads, "Total Leads");
      this.updateDashboardCard(
        "total-cost",
        `$${totalCost.toFixed(2)}`,
        "Total Cost"
      );
      this.updateDashboardCard(
        "avg-confidence",
        `${Math.round(avgConfidence)}%`,
        "Avg Confidence"
      );

      // Update recent campaigns
      this.updateRecentCampaigns(campaigns || []);
    } catch (error) {
      console.error("Dashboard loading error:", error);
    }
  }

  updateDashboardCard(id, value, label) {
    const valueEl = document.querySelector(`#${id} .dashboard-value`);
    const labelEl = document.querySelector(`#${id} .dashboard-label`);

    if (valueEl) valueEl.textContent = value;
    if (labelEl) labelEl.textContent = label;
  }

  updateRecentCampaigns(campaigns) {
    const container = document.getElementById("recentCampaigns");
    if (!container) return;

    if (campaigns.length === 0) {
      container.innerHTML =
        "<p>No campaigns found. Start your first discovery!</p>";
      return;
    }

    container.innerHTML = campaigns
      .map(
        (campaign) => `
      <div class="campaign-item">
        <div class="campaign-info">
          <strong>${campaign.business_type} in ${campaign.location}</strong>
          <div class="campaign-date">${new Date(
            campaign.created_at
          ).toLocaleDateString()}</div>
        </div>
        <div class="campaign-stats">
          <span class="campaign-leads">${
            campaign.results_count || 0
          } leads</span>
          <span class="campaign-cost">$${(campaign.total_cost || 0).toFixed(
            3
          )}</span>
          <button class="btn-export" onclick="window.prospectPro.exportCampaign('${
            campaign.id
          }')">Export</button>
        </div>
      </div>
    `
      )
      .join("");
  }

  async exportCampaign(campaignId) {
    try {
      const response = await fetch(
        `${this.supabase.supabaseUrl}/functions/v1/campaign-export/${campaignId}`,
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
      a.download = `campaign_${campaignId}_leads.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log("✅ Campaign CSV export completed");
    } catch (error) {
      console.error("❌ Campaign export error:", error);
      this.showError(`Export failed: ${error.message}`);
    }
  }

  async startDiscovery() {
    console.log("🚀 === STARTING DISCOVERY ===");

    if (this.campaignRunning) {
      console.log("⚠️ Campaign already running, skipping...");
      return;
    }

    try {
      // Get form values
      const businessTypeInput = document.getElementById("business-type");
      const businessTypeSelect = document.getElementById(
        "business-type-select"
      );
      const locationInput = document.getElementById("location");

      let businessType = businessTypeInput.value.trim();
      if (
        !businessType &&
        businessTypeSelect &&
        businessTypeSelect.style.display !== "none"
      ) {
        businessType = businessTypeSelect.value;
      }

      const location = locationInput.value.trim();

      // Get quantity from active button or slider
      const quantityBtn = document.querySelector(".lead-quantity-btn.active");
      const quantitySlider = document.getElementById("lead-quantity");
      let quantity = 3; // default

      if (quantityBtn) {
        quantity = parseInt(quantityBtn.textContent);
      } else if (quantitySlider) {
        quantity = parseInt(quantitySlider.value);
      }

      console.log("📊 Discovery parameters:", {
        businessType,
        location,
        quantity,
      });

      if (!businessType || !location) {
        console.log("❌ Missing required parameters");
        this.showError("Please enter both business type and location");
        return;
      }

      this.campaignRunning = true;
      this.setLoadingState(true);
      this.showCampaignProgress(true);

      console.log("✅ Pre-flight checks passed");

      // Get enhancement options
      const apolloEnabled =
        document.getElementById("enable-apollo")?.checked || false;
      const chamberEnabled =
        document.getElementById("enable-chamber")?.checked || false;
      const associationsEnabled =
        document.getElementById("enable-associations")?.checked || false;

      const payload = {
        businessType,
        location,
        maxResults: quantity,
        budgetLimit: 50,
        requireCompleteContacts: true,
        minConfidenceScore: 50,
        enhancementOptions: {
          apolloDiscovery: apolloEnabled,
          chamberVerification: chamberEnabled,
          tradeAssociations: associationsEnabled,
          professionalLicensing: false, // Not implemented yet
        },
      };

      console.log(
        "📦 Edge Function payload:",
        JSON.stringify(payload, null, 2)
      );
      console.log("📞 Calling Edge Function: business-discovery");

      const startTime = Date.now();

      // Call Supabase Edge Function
      const result = await this.supabase.functions.invoke(
        "business-discovery",
        {
          body: payload,
        }
      );

      const endTime = Date.now();
      console.log(
        `⏱️ Edge Function call completed in ${endTime - startTime}ms`
      );

      console.log("📥 Raw Edge Function result:", result);

      const { data, error } = result;

      if (error) {
        console.error("🚨 Edge Function returned error:", error);
        throw new Error(
          `Edge Function error: ${error.message || JSON.stringify(error)}`
        );
      }

      if (!data) {
        console.error("🚨 No data received from Edge Function");
        throw new Error("No data received from Edge Function");
      }

      if (!data.success) {
        console.error("🚨 Edge Function returned failure:", data);
        throw new Error(
          data.error || data.message || "Business discovery failed"
        );
      }

      console.log("🎉 Edge Function success!");

      // Store results for potential export
      this.searchResults = data.leads || [];
      this.lastSearchCampaignId = data.campaignId;
      this.lastSearchCampaignName = `${businessType} in ${location}`;

      // Show results with proper contact info
      this.showResults(data);

      console.log(
        `✅ Discovery completed: ${this.searchResults.length} leads found`
      );
    } catch (error) {
      console.error("🚨 === DISCOVERY ERROR ===", error);
      this.showError(`Discovery Failed: ${error.message}`);
    } finally {
      console.log("🏁 Discovery cleanup...");
      this.campaignRunning = false;
      this.setLoadingState(false);
      this.showCampaignProgress(false);
    }
  }

  showResults(data) {
    console.log("📊 Displaying results...", data);

    const resultsContainer = document.getElementById("results-container");
    const resultsSection = document.getElementById("search-results");

    if (!resultsContainer || !resultsSection) {
      console.error("❌ Results containers not found");
      return;
    }

    resultsContainer.innerHTML = `
      <div class="results-header">
        <h3>✅ Discovery Complete</h3>
        <div class="results-stats">
          <div class="stat-item">
            <strong>${data.results.totalFound}</strong> Businesses Found
          </div>
          <div class="stat-item">
            <strong>${data.results.qualified}</strong> Qualified Leads
          </div>
          <div class="stat-item">
            <strong>$${data.costs.totalCost.toFixed(4)}</strong> Total Cost
          </div>
          <div class="stat-item">
            <strong>${Math.round(
              data.results.averageConfidence
            )}%</strong> Avg Confidence
          </div>
        </div>
      </div>
      
      <div class="results-grid">
        ${data.leads
          .map(
            (lead) => `
          <div class="business-card" data-score="${lead.optimizedScore}">
            <div class="card-header">
              <h4 class="business-name">${lead.businessName}</h4>
              <div class="confidence-score ${this.getScoreClass(
                lead.optimizedScore
              )}">
                <span class="score-value">${lead.optimizedScore}%</span>
                <span class="score-label">Confidence</span>
              </div>
            </div>
            
            <div class="contact-info">
              <div class="info-item">
                <span class="info-icon">📍</span>
                <span class="info-text">${lead.address}</span>
              </div>
              
              ${
                lead.phone
                  ? `
                <div class="info-item">
                  <span class="info-icon">📞</span>
                  <a href="tel:${lead.phone}" class="info-link">${lead.phone}</a>
                </div>
              `
                  : ""
              }
              
              ${
                lead.website
                  ? `
                <div class="info-item">
                  <span class="info-icon">🌐</span>
                  <a href="${lead.website}" target="_blank" class="info-link">${lead.website}</a>
                </div>
              `
                  : ""
              }
              
              ${
                lead.email && lead.email !== "hello@example.com"
                  ? `
                <div class="info-item">
                  <span class="info-icon">✉️</span>
                  <a href="mailto:${lead.email}" class="info-link">${lead.email}</a>
                </div>
              `
                  : ""
              }
            </div>
            
            <div class="recommendation">
              ${lead.scoringRecommendation}
            </div>
            
            <div class="lead-footer">
              <span class="cost-indicator">Validation Cost: $${lead.validationCost.toFixed(
                4
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

    console.log("✅ Results displayed successfully");
  }

  showError(message) {
    console.error("🚨 Showing error to user:", message);

    const resultsContainer = document.getElementById("results-container");
    const resultsSection = document.getElementById("search-results");

    if (!resultsContainer || !resultsSection) {
      console.error("❌ Error: Results containers not found");
      alert("Error: " + message);
      return;
    }

    resultsContainer.innerHTML = `
      <div class="error-results">
        <h3>❌ Discovery Failed</h3>
        <p><strong>Error:</strong> ${message}</p>
        <p class="error-note">This system only returns real data from actual APIs. No fake data is generated.</p>
        <div class="suggestions">
          <h4>💡 Suggestions:</h4>
          <ul>
            <li>Check your internet connection</li>
            <li>Try a different business type or location</li>
            <li>Reduce the number of leads requested</li>
            <li>Try again in a few minutes</li>
          </ul>
        </div>
        <button onclick="window.prospectPro.startDiscovery()" class="btn">
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

    if (startButton) {
      if (loading) {
        startButton.textContent = "🔍 Discovering...";
        startButton.disabled = true;
      } else {
        startButton.textContent = "🚀 Search Businesses";
        startButton.disabled = false;
      }
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
    const quantitySlider = document.getElementById("lead-quantity");
    let quantity = 3;

    if (quantityBtn) {
      quantity = parseInt(quantityBtn.textContent);
    } else if (quantitySlider) {
      quantity = parseInt(quantitySlider.value);
    }

    const estimatedCost = (quantity * this.costPerLead).toFixed(2);

    const costAmount = document.querySelector(".cost-amount");
    if (costAmount) {
      costAmount.textContent = `$${estimatedCost}`;
    }
  }

  showWelcomeMessage() {
    console.log("🎉 ProspectPro Fixed Version Ready!");
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
  console.log("🚀 DOM loaded, initializing ProspectPro Fixed Version...");
  try {
    window.prospectProApp = new ProspectProSupabase();
    window.prospectPro = window.prospectProApp; // For backward compatibility
    console.log("✅ ProspectPro initialized successfully");
  } catch (error) {
    console.error("🚨 CRITICAL: Failed to initialize ProspectPro:", error);
    alert("Critical error: " + error.message);
  }
});

// Export for testing
window.ProspectProSupabase = ProspectProSupabase;
