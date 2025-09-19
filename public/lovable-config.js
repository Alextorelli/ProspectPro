// Lovable Frontend Config
// This file manages Lovable feature toggles, API keys, and onboarding options for ProspectPro dashboards.

const LovableConfig = {
  // Feature toggles
  enabled: false, // Master switch for Lovable features
  onboardingEnabled: false, // Enable Lovable onboarding flow
  showLovableAnalytics: true, // Show Lovable-specific campaign analytics

  // API keys (to be securely injected in production)
  apiKey: "", // TODO: Set via environment or secure config

  // UI options
  showOnDashboard: true, // Display Lovable controls in admin/business dashboards
  campaignSettings: {
    allowLovable: true, // Allow campaigns to opt-in to Lovable features
    defaultLovableStatus: "disabled", // 'enabled' | 'disabled' | 'pending'
  },

  // TODO: Add more Lovable config options as features expand
};

export default LovableConfig;
