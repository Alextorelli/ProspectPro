/**
 * Registry Provider Index
 * Central registration point for all registry validation providers
 */

// Import all providers
// eslint-disable-next-line no-eval
const localRequire = eval("require");

const CaliforniaSOSProvider = localRequire("./california-sos-provider");
const CobaltSOSProvider = localRequire("./cobalt-sos-provider");
const NewYorkSOSProvider = localRequire("./newyork-sos-provider");
const ProPublicaProvider = localRequire("./propublica-provider");
const SECEdgarProvider = localRequire("./sec-edgar-provider");
const USPTOProvider = localRequire("./uspto-provider");
const CompaniesHouseUKProvider = localRequire("./companies-house-uk-provider");

// Provider registry
const AVAILABLE_PROVIDERS = {
  "california-sos": CaliforniaSOSProvider,
  "cobalt-sos": CobaltSOSProvider,
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
        case "cobalt-sos":
          instances[name] = new ProviderClass(providerConfig);
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
    case "cobalt-sos":
      return new ProviderClass(config);
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
