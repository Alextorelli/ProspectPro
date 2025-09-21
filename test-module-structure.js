#!/usr/bin/env node

const EnhancedLeadDiscovery = require("./modules/enhanced-lead-discovery");

console.log("🔍 Testing Enhanced Lead Discovery Module...");

try {
  const discovery = new EnhancedLeadDiscovery();
  console.log("✅ Enhanced Lead Discovery module loaded successfully");

  console.log("\nAvailable methods:");
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(discovery))
    .filter((name) => name !== "constructor")
    .filter((name) => typeof discovery[name] === "function");

  methods.forEach((method) => {
    console.log(`  - ${method}`);
  });

  console.log("\nClient availability:");
  console.log(
    `Foursquare client: ${
      discovery.foursquareClient ? "✅ Available" : "❌ Missing"
    }`
  );
  console.log(
    `California SOS client: ${
      discovery.californiaSOSClient ? "✅ Available" : "❌ Missing"
    }`
  );
  console.log(
    `New York SOS client: ${
      discovery.newYorkSOSClient ? "✅ Available" : "❌ Missing"
    }`
  );
  console.log(
    `Hunter client: ${discovery.hunterClient ? "✅ Available" : "❌ Missing"}`
  );
  console.log(
    `NeverBounce client: ${
      discovery.neverBounceClient ? "✅ Available" : "❌ Missing"
    }`
  );

  if (discovery.foursquareClient) {
    console.log(
      `\n📍 Foursquare client type: ${discovery.foursquareClient.constructor.name}`
    );

    // Test Foursquare client access
    console.log("\nTesting direct Foursquare access...");
    discovery.foursquareClient
      .searchPlaces("test", { near: "New York, NY", limit: 1 })
      .then((result) => {
        console.log(
          `✅ Foursquare search test: ${
            result.found ? "Success" : "No results"
          }`
        );
      })
      .catch((error) => {
        console.log(`❌ Foursquare search test failed: ${error.message}`);
      });
  }
} catch (error) {
  console.log(`❌ Module loading failed: ${error.message}`);
  console.log(error.stack);
}
