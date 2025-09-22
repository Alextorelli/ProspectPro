/**
 * Registry Provider Index
 * Central registration point for all registry validation providers
 */

// Import all providers
const CaliforniaSOSProvider = require("./california-sos-provider");
const NewYorkSOSProvider = require("./newyork-sos-provider");
const ProPublicaProvider = require("./propublica-provider");
const SECEdgarProvider = require("./sec-edgar-provider");
const USPTOProvider = require("./uspto-provider");
const CompaniesHouseUKProvider = require("./companies-house-uk-provider");

// Provider registry
const AVAILABLE_PROVIDERS = {
  "california-sos": CaliforniaSOSProvider,
  "newyork-sos": NewYorkSOSProvider,
  propublica: ProPublicaProvider,
  "sec-edgar": SECEdgarProvider,
  uspto: USPTOProvider,
  "companies-house-uk": CompaniesHouseUKProvider,
};

/**
 * Get all available provider classes
 */
function getAllProviders() {
  return AVAILABLE_PROVIDERS;
}

/**
 * Get provider class by name
 */
function getProvider(name) {
  return AVAILABLE_PROVIDERS[name];
}

/**
 * Get list of available provider names
 */
function getProviderNames() {
  return Object.keys(AVAILABLE_PROVIDERS);
}

/**
 * Create instances of all providers with optional configuration
 */
function createAllProviders(config = {}) {
  const instances = {};

  for (const [name, ProviderClass] of Object.entries(AVAILABLE_PROVIDERS)) {
    try {
      // Provider-specific configuration
      const providerConfig = config[name] || {};

      switch (name) {
        case "california-sos":
          instances[name] = new ProviderClass(providerConfig.apiKey);
          break;
        case "newyork-sos":
          instances[name] = new ProviderClass(providerConfig.apiKey);
          break;
        case "propublica":
          instances[name] = new ProviderClass(providerConfig.apiKey);
          break;
        case "sec-edgar":
          instances[name] = new ProviderClass(providerConfig.userAgent);
          break;
        case "uspto":
          instances[name] = new ProviderClass(providerConfig.apiKey);
          break;
        case "companies-house-uk":
          instances[name] = new ProviderClass(providerConfig.apiKey);
          break;
        default:
          instances[name] = new ProviderClass();
      }
    } catch (error) {
      console.warn(`Failed to initialize provider ${name}:`, error.message);
      // Continue with other providers
    }
  }

  return instances;
}

/**
 * Create specific provider instances
 */
function createProvider(name, config = {}) {
  const ProviderClass = AVAILABLE_PROVIDERS[name];
  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${name}`);
  }

  switch (name) {
    case "california-sos":
      return new ProviderClass(config.apiKey);
    case "newyork-sos":
      return new ProviderClass(config.apiKey);
    case "propublica":
      return new ProviderClass(config.apiKey);
    case "sec-edgar":
      return new ProviderClass(config.userAgent);
    case "uspto":
      return new ProviderClass(config.apiKey);
    case "companies-house-uk":
      return new ProviderClass(config.apiKey);
    default:
      return new ProviderClass();
  }
}

module.exports = {
  getAllProviders,
  getProvider,
  getProviderNames,
  createAllProviders,
  createProvider,
  AVAILABLE_PROVIDERS,
};
