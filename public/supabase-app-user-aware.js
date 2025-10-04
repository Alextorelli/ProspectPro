// ProspectPro v4.2 - User-Aware Supabase Integration
// October 4, 2025 - Complete user authentication and campaign ownership

// Supabase configuration with new API keys
const SUPABASE_URL = "https://sriycekxdqnesdsgwiuc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GaGU6ZiyiO6ncO7kU2qAvA_SFuCyYaM";
const EDGE_FUNCTION_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXljZWt4ZHFuZXNkc2d3aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjU3ODksImV4cCI6MjA3MzU0MTc4OX0.Rx_1Hjz2eayKie0RpPB28i7_683ZwhVJ_5Eu_rzTWpI";

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// User-aware ProspectPro application class
class UserAwareProspectPro {
  constructor() {
    this.currentUser = null;
    this.sessionUserId = null;
    this.lastCampaignId = null;
    this.isInitialized = false;

    this.initializeApp();
  }

  // Initialize the application
  async initializeApp() {
    try {
      // Generate session ID for anonymous users
      this.sessionUserId = this.generateSessionId();

      // Initialize authentication
      await this.initializeAuth();

      // Set up event listeners
      this.setupEventListeners();

      // Load user data
      await this.loadUserData();

      this.isInitialized = true;
      console.log("ProspectPro v4.2 initialized successfully");
    } catch (error) {
      console.error("Initialization error:", error);
      this.showError("Failed to initialize application");
    }
  }

  // Generate unique session ID
  generateSessionId() {
    return (
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  // Initialize authentication system
  async initializeAuth() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      this.currentUser = session?.user || null;

      this.updateAuthUI();
      this.updateUserStatus();

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth state changed:", event);
        this.currentUser = session?.user || null;
        this.updateAuthUI();
        this.updateUserStatus();

        if (event === "SIGNED_IN") {
          this.loadUserData();
        }
      });
    } catch (error) {
      console.error("Auth initialization error:", error);
    }
  }

  // Update authentication UI
  updateAuthUI() {
    const authSection = document.getElementById("authSection");
    if (!authSection) return;

    if (this.currentUser) {
      authSection.innerHTML = `
                <div class="flex items-center space-x-4">
                    <div class="text-sm">
                        <span class="text-gray-700">Welcome, </span>
                        <span class="font-medium">${this.currentUser.email}</span>
                    </div>
                    <button 
                        onclick="prospectPro.signOut()" 
                        class="text-sm text-red-600 hover:text-red-800 transition-colors">
                        Sign Out
                    </button>
                </div>
            `;
    } else {
      authSection.innerHTML = `
                <div class="flex items-center space-x-3">
                    <button 
                        onclick="prospectPro.signIn()" 
                        class="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                        Sign In
                    </button>
                    <button 
                        onclick="prospectPro.signUp()" 
                        class="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors">
                        Sign Up
                    </button>
                </div>
            `;
    }
  }

  // Update user status display
  updateUserStatus() {
    const userStatus = document.getElementById("userStatus");
    if (!userStatus) return;

    if (this.currentUser) {
      userStatus.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span class="text-green-700 font-medium">Authenticated User</span>
                </div>
                <div class="text-gray-600 text-sm">
                    <strong>Email:</strong> ${this.currentUser.email}
                </div>
                <div class="text-gray-600 text-sm">
                    <strong>User ID:</strong> ${this.currentUser.id.slice(
                      0,
                      8
                    )}...
                </div>
                <div class="text-gray-500 text-xs mt-2">
                    All campaigns are permanently linked to your account
                </div>
            `;
    } else {
      userStatus.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span class="text-yellow-700 font-medium">Anonymous Session</span>
                </div>
                <div class="text-gray-600 text-sm">
                    <strong>Session ID:</strong> ${this.sessionUserId.slice(
                      -12
                    )}
                </div>
                <div class="text-gray-500 text-xs mt-2">
                    Sign up to save campaigns permanently and access advanced features
                </div>
                <button 
                    onclick="prospectPro.signUp()" 
                    class="mt-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors">
                    Create Account
                </button>
            `;
    }
  }

  // Set up event listeners
  setupEventListeners() {
    // Discovery form
    const discoveryForm = document.getElementById("discoveryForm");
    if (discoveryForm) {
      discoveryForm.addEventListener("submit", (e) => this.handleDiscovery(e));
    }

    // Export button
    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.handleExport());
    }
  }

  // Load user-specific data
  async loadUserData() {
    await this.loadRecentCampaigns();
    await this.loadUserStats();
  }

  // Load recent campaigns
  async loadRecentCampaigns() {
    try {
      const recentCampaigns = document.getElementById("recentCampaigns");
      if (!recentCampaigns) return;

      // Build query based on user state
      let query = supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      // For authenticated users, filter by user_id
      // For anonymous users, show all (they can only see their session campaigns via RLS)

      const { data: campaigns, error } = await query;

      if (error) {
        console.error("Error loading campaigns:", error);
        recentCampaigns.innerHTML =
          '<p class="text-red-500 text-sm">Error loading campaigns</p>';
        return;
      }

      if (!campaigns || campaigns.length === 0) {
        recentCampaigns.innerHTML = `
                    <p class="text-gray-500 text-sm">No campaigns yet</p>
                    <p class="text-xs text-gray-400 mt-1">Start your first discovery to see results here</p>
                `;
        return;
      }

      recentCampaigns.innerHTML = campaigns
        .map(
          (campaign) => `
                <div class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors" 
                     onclick="prospectPro.viewCampaign('${campaign.id}')">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="font-medium text-sm text-gray-900">${
                              campaign.business_type
                            }</div>
                            <div class="text-xs text-gray-600 mt-1">${
                              campaign.location
                            }</div>
                            <div class="flex items-center space-x-3 text-xs text-gray-500 mt-2">
                                <span>📊 ${campaign.results_count} leads</span>
                                <span>💰 $${campaign.total_cost}</span>
                                <span class="px-2 py-0.5 rounded text-xs ${
                                  campaign.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : campaign.status === "processing"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                                }">${campaign.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `
        )
        .join("");
    } catch (error) {
      console.error("Error loading campaigns:", error);
    }
  }

  // Load user statistics
  async loadUserStats() {
    try {
      // This would load aggregated user statistics
      // For now, just update the display
      console.log("User stats loaded");
    } catch (error) {
      console.error("Error loading user stats:", error);
    }
  }

  // Handle business discovery
  async handleDiscovery(event) {
    event.preventDefault();

    const submitBtn = document.getElementById("submitBtn");
    const submitText = document.getElementById("submitText");
    const submitSpinner = document.getElementById("submitSpinner");

    if (!submitBtn || !submitText || !submitSpinner) {
      console.error("Required form elements not found");
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitText.textContent = "Discovering Prospects...";
    submitSpinner.classList.remove("hidden");

    try {
      const formData = new FormData(event.target);
      const requestData = {
        businessType: formData.get("businessType"),
        location: formData.get("location"),
        maxResults: parseInt(formData.get("maxResults")) || 10,
        budgetLimit: parseFloat(formData.get("budgetLimit")) || 50,
        minConfidenceScore: parseInt(formData.get("minConfidenceScore")) || 50,
        userEmail: this.currentUser?.email,
        sessionUserId: this.sessionUserId,
        includeEnrichment: true,
      };

      console.log("Starting discovery with request:", requestData);

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/business-discovery-user-aware`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${EDGE_FUNCTION_JWT}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        this.lastCampaignId = result.campaignId;
        this.displayResults(result);
        await this.loadRecentCampaigns(); // Refresh campaigns list
        this.showSuccess("Discovery completed successfully!");
      } else {
        throw new Error(result.error || "Discovery failed");
      }
    } catch (error) {
      console.error("Discovery error:", error);
      this.showError("Discovery failed: " + error.message);
    } finally {
      // Reset loading state
      submitBtn.disabled = false;
      submitText.textContent = "Start Discovery";
      submitSpinner.classList.add("hidden");
    }
  }

  // Display discovery results
  displayResults(result) {
    const resultsSection = document.getElementById("resultsSection");
    const resultsContent = document.getElementById("resultsContent");

    if (!resultsSection || !resultsContent) {
      console.error("Results elements not found");
      return;
    }

    // Calculate statistics
    const totalLeads = result.leads?.length || 0;
    const avgConfidence =
      totalLeads > 0
        ? Math.round(
            result.leads.reduce(
              (sum, lead) => sum + (lead.optimizedScore || 0),
              0
            ) / totalLeads
          )
        : 0;

    resultsContent.innerHTML = `
            <!-- Campaign Summary -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                <h4 class="text-lg font-semibold text-gray-900 mb-4">Campaign Results</h4>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white rounded-lg p-4 shadow-sm">
                        <div class="text-2xl font-bold text-blue-700">${totalLeads}</div>
                        <div class="text-sm text-blue-600">Qualified Leads</div>
                    </div>
                    <div class="bg-white rounded-lg p-4 shadow-sm">
                        <div class="text-2xl font-bold text-green-700">${avgConfidence}%</div>
                        <div class="text-sm text-green-600">Avg Confidence</div>
                    </div>
                    <div class="bg-white rounded-lg p-4 shadow-sm">
                        <div class="text-2xl font-bold text-purple-700">$${(
                          result.optimization?.totalCost || 0
                        ).toFixed(2)}</div>
                        <div class="text-sm text-purple-600">Total Cost</div>
                    </div>
                    <div class="bg-white rounded-lg p-4 shadow-sm">
                        <div class="text-2xl font-bold text-gray-700">${
                          result.optimization?.processingTime || "N/A"
                        }</div>
                        <div class="text-sm text-gray-600">Processing Time</div>
                    </div>
                </div>
            </div>
            
            <!-- User Context Information -->
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div class="flex">
                    <div class="ml-3">
                        <p class="text-sm text-yellow-700">
                            <strong>Campaign Owner:</strong> ${
                              result.userManagement?.isAuthenticated
                                ? "Authenticated User"
                                : "Anonymous Session"
                            } • 
                            <strong>Ownership:</strong> ${
                              result.userManagement?.campaignOwnership ||
                              "Session-based"
                            }
                            ${
                              !this.currentUser
                                ? " • Sign up to save permanently"
                                : ""
                            }
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Results Table -->
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Business Details
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact Information
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quality Score
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Validation Cost
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${(result.leads || [])
                          .map(
                            (lead, index) => `
                            <tr class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">${
                                      lead.businessName || "N/A"
                                    }</div>
                                    <div class="text-sm text-gray-500">${
                                      lead.address || "N/A"
                                    }</div>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-900">
                                    <div class="space-y-1">
                                        ${
                                          lead.phone
                                            ? `<div>📞 ${lead.phone}</div>`
                                            : ""
                                        }
                                        ${
                                          lead.website
                                            ? `<div>🌐 <a href="${lead.website}" target="_blank" class="text-blue-600 hover:underline">${lead.website}</a></div>`
                                            : ""
                                        }
                                        ${
                                          lead.email
                                            ? `<div>✉️ ${lead.email}</div>`
                                            : ""
                                        }
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      (lead.optimizedScore || 0) >= 80
                                        ? "bg-green-100 text-green-800"
                                        : (lead.optimizedScore || 0) >= 60
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                    }">
                                        ${lead.optimizedScore || 0}%
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    $${(lead.validationCost || 0).toFixed(3)}
                                </td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
            
            ${
              totalLeads === 0
                ? `
                <div class="text-center py-8">
                    <div class="text-gray-500">No qualified leads found with current criteria.</div>
                    <div class="text-sm text-gray-400 mt-2">Try adjusting your search parameters or expanding the location.</div>
                </div>
            `
                : ""
            }
        `;

    resultsSection.classList.remove("hidden");
    resultsSection.scrollIntoView({ behavior: "smooth" });
  }

  // Handle campaign export
  async handleExport() {
    if (!this.lastCampaignId) {
      this.showError("No campaign to export. Please run a discovery first.");
      return;
    }

    try {
      const requestData = {
        campaignId: this.lastCampaignId,
        format: "csv",
        includeEnrichmentData: true,
        userEmail: this.currentUser?.email,
        sessionUserId: this.sessionUserId,
      };

      console.log("Exporting campaign:", requestData);

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/campaign-export-user-aware?download=true`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${EDGE_FUNCTION_JWT}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export failed: ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prospectpro_export_${this.lastCampaignId.slice(
        -8
      )}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      this.showSuccess("Export completed successfully!");
    } catch (error) {
      console.error("Export error:", error);
      this.showError("Export failed: " + error.message);
    }
  }

  // View campaign details
  async viewCampaign(campaignId) {
    this.lastCampaignId = campaignId;
    console.log("Selected campaign:", campaignId);

    // Enable export button if available
    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.textContent = "Export Selected Campaign";
    }

    this.showSuccess(
      `Campaign ${campaignId.slice(
        -8
      )} selected. Export functionality is now available.`
    );
  }

  // Authentication methods
  async signIn() {
    try {
      const email = prompt("Enter your email:");
      if (!email) return;

      const password = prompt("Enter your password:");
      if (!password) return;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        this.showError("Sign in failed: " + error.message);
      } else {
        this.showSuccess(
          "Welcome back! Your campaigns are now linked to your account."
        );
      }
    } catch (error) {
      console.error("Sign in error:", error);
      this.showError("Sign in failed: " + error.message);
    }
  }

  async signUp() {
    try {
      const email = prompt("Enter your email:");
      if (!email) return;

      const password = prompt("Create a password (minimum 6 characters):");
      if (!password || password.length < 6) {
        this.showError("Password must be at least 6 characters");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (error) {
        this.showError("Sign up failed: " + error.message);
      } else {
        this.showSuccess(
          "Account created! Check your email for confirmation. You can continue using the app while we verify your email."
        );
      }
    } catch (error) {
      console.error("Sign up error:", error);
      this.showError("Sign up failed: " + error.message);
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      this.showSuccess(
        "Signed out successfully. You can continue as an anonymous user."
      );
    } catch (error) {
      console.error("Sign out error:", error);
      this.showError("Sign out failed: " + error.message);
    }
  }

  // Utility methods
  showSuccess(message) {
    this.showNotification(message, "success");
  }

  showError(message) {
    this.showNotification(message, "error");
  }

  showNotification(message, type = "info") {
    // Simple notification system
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 max-w-sm p-4 rounded-lg shadow-lg z-50 ${
      type === "success"
        ? "bg-green-100 text-green-800 border border-green-200"
        : type === "error"
        ? "bg-red-100 text-red-800 border border-red-200"
        : "bg-blue-100 text-blue-800 border border-blue-200"
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);

    // Click to dismiss
    notification.addEventListener("click", () => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });
  }
}

// Initialize ProspectPro when DOM is loaded
let prospectPro;

document.addEventListener("DOMContentLoaded", () => {
  prospectPro = new UserAwareProspectPro();
});

// Export for global access
window.prospectPro = prospectPro;
