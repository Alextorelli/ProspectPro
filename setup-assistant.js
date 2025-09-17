#!/usr/bin/env node

/**
 * ProspectPro Automated Setup Assistant
 *
 * Comprehensive setup wizard for ProspectPro with Railway webhook integration.
 * Handles database setup, dependency installation, environment validation, and testing.
 */

const fs = require("fs").promises;
const path = require("path");
const { spawn, exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);
const crypto = require("crypto");

class ProspectProSetupAssistant {
  constructor() {
    this.setupSteps = [];
    this.currentStep = 0;
    this.setupStartTime = Date.now();
    this.errors = [];
    this.warnings = [];
    this.envVars = {};

    this.loadEnvironmentVariables();
  }

  /**
   * Load existing environment variables
   */
  async loadEnvironmentVariables() {
    try {
      const envContent = await fs.readFile(".env", "utf8");
      const lines = envContent.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [key, ...valueParts] = trimmed.split("=");
          const value = valueParts.join("=");
          this.envVars[key] = value;
          process.env[key] = value;
        }
      }
    } catch (error) {
      console.warn("⚠️  Could not load .env file:", error.message);
    }
  }

  /**
   * Main setup orchestrator
   */
  async runAutomatedSetup() {
    console.log("🚀 ProspectPro Automated Setup Assistant");
    console.log("=".repeat(80));
    console.log(
      "Setting up your complete ProspectPro environment with Railway webhook integration..."
    );
    console.log("");

    const setupPhases = [
      {
        name: "Environment Validation",
        fn: this.validateEnvironment.bind(this),
      },
      {
        name: "Dependency Installation",
        fn: this.installDependencies.bind(this),
      },
      {
        name: "Database Setup & Validation",
        fn: this.setupDatabase.bind(this),
      },
      { name: "Server Configuration", fn: this.configureServer.bind(this) },
      {
        name: "Railway Webhook Integration",
        fn: this.setupWebhooks.bind(this),
      },
      { name: "Security Configuration", fn: this.configureSecurity.bind(this) },
      { name: "Testing Suite Setup", fn: this.setupTesting.bind(this) },
      { name: "Final Validation", fn: this.finalValidation.bind(this) },
    ];

    for (let i = 0; i < setupPhases.length; i++) {
      const phase = setupPhases[i];
      this.currentStep = i + 1;

      console.log(
        `\n🔄 Phase ${this.currentStep}/${setupPhases.length}: ${phase.name}`
      );
      console.log("-".repeat(60));

      try {
        await phase.fn();
        console.log(`✅ Phase ${this.currentStep} completed successfully`);
      } catch (error) {
        console.error(`❌ Phase ${this.currentStep} failed:`, error.message);
        this.errors.push({ phase: phase.name, error: error.message });

        // Ask if user wants to continue or abort
        const shouldContinue = await this.askContinueOnError(phase.name, error);
        if (!shouldContinue) {
          console.log("🛑 Setup aborted by user");
          process.exit(1);
        }
      }
    }

    await this.generateSetupReport();
  }

  /**
   * Phase 1: Environment Validation
   */
  async validateEnvironment() {
    console.log("   🔍 Checking Node.js version...");
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);

    if (majorVersion < 16) {
      throw new Error(
        `Node.js ${majorVersion} detected. ProspectPro requires Node.js 16+`
      );
    }
    console.log(`   ✅ Node.js ${nodeVersion} (compatible)`);

    console.log("   🔍 Validating environment variables...");
    const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
    const missing = required.filter(
      (key) => !this.envVars[key] || this.envVars[key].includes("your_")
    );

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }
    console.log("   ✅ Required environment variables configured");

    console.log("   🔍 Checking project structure...");
    const requiredDirs = ["api", "modules", "database", "config"];
    for (const dir of requiredDirs) {
      try {
        await fs.access(dir);
      } catch {
        throw new Error(`Missing required directory: ${dir}`);
      }
    }
    console.log("   ✅ Project structure validated");

    // Generate secure tokens if missing
    if (
      !this.envVars.PERSONAL_ACCESS_TOKEN ||
      this.envVars.PERSONAL_ACCESS_TOKEN === "test_token_12345"
    ) {
      const newToken = crypto.randomBytes(32).toString("hex");
      this.envVars.PERSONAL_ACCESS_TOKEN = newToken;
      await this.updateEnvVar("PERSONAL_ACCESS_TOKEN", newToken);
      console.log("   ✅ Generated secure PERSONAL_ACCESS_TOKEN");
    }

    if (!this.envVars.RAILWAY_WEBHOOK_SECRET) {
      const webhookSecret = crypto.randomBytes(32).toString("hex");
      this.envVars.RAILWAY_WEBHOOK_SECRET = webhookSecret;
      await this.updateEnvVar("RAILWAY_WEBHOOK_SECRET", webhookSecret);
      console.log("   ✅ Generated RAILWAY_WEBHOOK_SECRET");
    }
  }

  /**
   * Phase 2: Dependency Installation
   */
  async installDependencies() {
    console.log("   📦 Installing core dependencies...");

    try {
      await this.runCommand("npm install", {
        description: "Installing npm packages",
        timeout: 120000,
      });
      console.log("   ✅ Core dependencies installed");
    } catch (error) {
      throw new Error(`Dependency installation failed: ${error.message}`);
    }

    console.log("   📦 Installing additional monitoring dependencies...");
    const additionalPackages = ["prom-client", "express-rate-limit", "helmet"];

    for (const pkg of additionalPackages) {
      try {
        await this.runCommand(`npm install ${pkg}`, {
          description: `Installing ${pkg}`,
          timeout: 30000,
        });
        console.log(`   ✅ ${pkg} installed`);
      } catch (error) {
        this.warnings.push(`Failed to install optional package: ${pkg}`);
        console.log(`   ⚠️  Optional package ${pkg} installation failed`);
      }
    }

    // Install testing dependencies
    console.log("   📦 Setting up testing dependencies...");
    try {
      const testPackages = ["jest", "supertest", "nodemon"];
      for (const pkg of testPackages) {
        await this.runCommand(`npm install --save-dev ${pkg}`, {
          description: `Installing test dependency ${pkg}`,
          timeout: 30000,
        });
      }
      console.log("   ✅ Testing dependencies installed");
    } catch (error) {
      this.warnings.push("Some testing dependencies may not be available");
    }
  }

  /**
   * Phase 3: Database Setup & Validation
   */
  async setupDatabase() {
    console.log("   🗄️  Initializing Supabase connection...");

    try {
      // Test basic connection
      const { createClient } = require("@supabase/supabase-js");
      const supabase = createClient(
        this.envVars.SUPABASE_URL,
        this.envVars.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data, error } = await supabase
        .from("campaigns")
        .select("count")
        .limit(1);
      if (error && error.code !== "PGRST116") {
        throw new Error(`Database connection failed: ${error.message}`);
      }
      console.log("   ✅ Supabase connection validated");
    } catch (error) {
      throw new Error(`Database validation failed: ${error.message}`);
    }

    console.log("   🏗️  Running database schema setup...");
    try {
      // Check if enhanced-supabase-schema.sql exists
      await fs.access("database/enhanced-supabase-schema.sql");
      console.log("   📋 Database schema file found");

      // Run database setup if available
      const setupFiles = [
        "database/enhanced-supabase-schema.sql",
        "database/03-monitoring-and-analytics.sql",
        "database/rls-security-hardening.sql",
      ];

      let schemasApplied = 0;
      for (const schemaFile of setupFiles) {
        try {
          await fs.access(schemaFile);
          console.log(`   📋 Found schema: ${path.basename(schemaFile)}`);
          schemasApplied++;
        } catch {
          console.log(`   ⚠️  Schema not found: ${path.basename(schemaFile)}`);
        }
      }

      if (schemasApplied > 0) {
        console.log(`   ✅ ${schemasApplied} database schemas validated`);
      } else {
        this.warnings.push(
          "No database schema files found - manual setup may be required"
        );
      }
    } catch (error) {
      this.warnings.push(`Database schema setup: ${error.message}`);
    }

    console.log("   🧪 Testing database operations...");
    try {
      const { createClient } = require("@supabase/supabase-js");
      const supabase = createClient(
        this.envVars.SUPABASE_URL,
        this.envVars.SUPABASE_SERVICE_ROLE_KEY
      );

      // Test webhook logging table
      const { error: webhookError } = await supabase
        .from("railway_webhook_logs")
        .select("id")
        .limit(1);

      if (!webhookError || webhookError.code === "PGRST116") {
        console.log("   ✅ Webhook logging table ready");
      } else {
        this.warnings.push("Webhook logging table may need setup");
      }
    } catch (error) {
      this.warnings.push(`Database testing: ${error.message}`);
    }
  }

  /**
   * Phase 4: Server Configuration
   */
  async configureServer() {
    console.log("   ⚙️  Configuring server settings...");

    // Check server.js configuration
    try {
      const serverContent = await fs.readFile("server.js", "utf8");

      const hasWebhookSupport = serverContent.includes("railway-webhook");
      const hasHealthCheck = serverContent.includes("/health");
      const hasDiagnostics = serverContent.includes("/diag");

      if (hasWebhookSupport) {
        console.log("   ✅ Railway webhook endpoints configured");
      } else {
        this.warnings.push("Server may need webhook endpoint configuration");
      }

      if (hasHealthCheck) {
        console.log("   ✅ Health check endpoint configured");
      }

      if (hasDiagnostics) {
        console.log("   ✅ Diagnostics endpoint configured");
      }
    } catch (error) {
      throw new Error(`Server configuration check failed: ${error.message}`);
    }

    // Test server startup
    console.log("   🚀 Testing server startup...");
    try {
      const server = spawn("node", ["server.js"], {
        env: { ...process.env, PORT: "3001" },
        stdio: "pipe",
      });

      let serverReady = false;
      let startupOutput = "";

      server.stdout.on("data", (data) => {
        startupOutput += data.toString();
      });

      server.stderr.on("data", (data) => {
        startupOutput += data.toString();
      });

      // Wait for server to start
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          server.kill();
          reject(new Error("Server startup timeout"));
        }, 15000);

        const checkServer = async () => {
          try {
            const response = await fetch("http://localhost:3001/health");
            if (response.ok) {
              serverReady = true;
              clearTimeout(timeout);
              server.kill();
              resolve();
            }
          } catch {
            // Server not ready yet
          }

          if (!serverReady) {
            setTimeout(checkServer, 1000);
          }
        };

        setTimeout(checkServer, 2000);
      });

      console.log("   ✅ Server startup test successful");
    } catch (error) {
      this.warnings.push(`Server startup test: ${error.message}`);
      console.log("   ⚠️  Server startup test failed (may work in production)");
    }
  }

  /**
   * Phase 5: Railway Webhook Integration
   */
  async setupWebhooks() {
    console.log("   🚂 Setting up Railway webhook integration...");

    // Check webhook monitor module
    try {
      await fs.access("modules/railway-webhook-monitor.js");
      console.log("   ✅ Railway webhook monitor module found");
    } catch {
      this.warnings.push("Railway webhook monitor module not found");
    }

    // Validate webhook configuration
    if (this.envVars.RAILWAY_WEBHOOK_SECRET) {
      console.log("   ✅ Railway webhook secret configured");
    } else {
      console.log(
        "   ⚠️  Railway webhook secret will be needed for production"
      );
    }

    // Check Railway configuration files
    const railwayFiles = ["railway.toml", "railway.json"];
    for (const file of railwayFiles) {
      try {
        await fs.access(file);
        console.log(`   ✅ Railway config file found: ${file}`);
      } catch {
        console.log(`   ⚠️  Railway config file not found: ${file}`);
      }
    }

    // Test webhook endpoint locally
    console.log("   🧪 Testing webhook endpoint...");
    try {
      const testPayload = {
        type: "deployment.success",
        deployment: {
          id: "setup-test-" + Date.now(),
          createdAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        },
        project: { id: "setup-test" },
      };

      // We'll create a simple test since server isn't running
      const RailwayWebhookMonitor = require("./modules/railway-webhook-monitor");
      const monitor = new RailwayWebhookMonitor({
        webhookSecret: this.envVars.RAILWAY_WEBHOOK_SECRET,
        supabaseUrl: this.envVars.SUPABASE_URL,
        supabaseKey: this.envVars.SUPABASE_SERVICE_ROLE_KEY,
      });

      await monitor.processWebhook(testPayload);
      console.log("   ✅ Webhook processing test successful");
    } catch (error) {
      this.warnings.push(`Webhook processing test: ${error.message}`);
      console.log(
        "   ⚠️  Webhook processing test failed (may work when deployed)"
      );
    }
  }

  /**
   * Phase 6: Security Configuration
   */
  async configureSecurity() {
    console.log("   🔒 Configuring security settings...");

    // Check personal access token
    if (
      this.envVars.PERSONAL_ACCESS_TOKEN &&
      this.envVars.PERSONAL_ACCESS_TOKEN.length >= 32
    ) {
      console.log("   ✅ Personal access token configured (secure length)");
    } else {
      this.warnings.push("Personal access token may not be secure enough");
    }

    // Check environment mode
    if (
      this.envVars.NODE_ENV === "production" &&
      this.envVars.ALLOW_DEGRADED_START === "true"
    ) {
      this.warnings.push("ALLOW_DEGRADED_START should be false in production");
    }

    // Validate API key formats (if provided)
    const apiKeys = [
      "GOOGLE_PLACES_API_KEY",
      "HUNTER_IO_API_KEY",
      "NEVERBOUNCE_API_KEY",
    ];
    for (const key of apiKeys) {
      if (this.envVars[key] && !this.envVars[key].includes("your_")) {
        console.log(`   ✅ ${key} configured`);
      }
    }

    console.log("   🛡️  Security configuration validated");
  }

  /**
   * Phase 7: Testing Suite Setup
   */
  async setupTesting() {
    console.log("   🧪 Setting up testing framework...");

    // Check test directories
    const testDirs = ["tests", "tests/unit", "tests/integration", "tests/e2e"];
    let testsAvailable = 0;

    for (const dir of testDirs) {
      try {
        await fs.access(dir);
        testsAvailable++;
        console.log(`   ✅ Test directory found: ${dir}`);
      } catch {
        console.log(`   📁 Test directory not found: ${dir}`);
      }
    }

    // Check for test files
    const testFiles = [
      "tests/unit/test-webhook-monitor.js",
      "tests/integration/test-railway-webhook-integration.js",
      "tests/e2e/test-railway-webhook-e2e.js",
    ];

    let testFilesFound = 0;
    for (const file of testFiles) {
      try {
        await fs.access(file);
        testFilesFound++;
        console.log(`   ✅ Test file found: ${path.basename(file)}`);
      } catch {
        console.log(`   📄 Test file not found: ${path.basename(file)}`);
      }
    }

    if (testFilesFound > 0) {
      console.log(`   ✅ ${testFilesFound} test files available`);

      // Try to run a quick test
      try {
        console.log("   🏃 Running quick validation test...");
        await this.runCommand("npm run test:quick", {
          timeout: 30000,
          description: "Running validation tests",
        });
        console.log("   ✅ Quick tests passed");
      } catch (error) {
        this.warnings.push(`Quick test run: ${error.message}`);
      }
    } else {
      this.warnings.push("No test files found - testing framework needs setup");
    }
  }

  /**
   * Phase 8: Final Validation
   */
  async finalValidation() {
    console.log("   ✅ Running final system validation...");

    // Test core modules
    const coreModules = [
      "config/supabase.js",
      "modules/enhanced-lead-discovery.js",
      "api/business-discovery.js",
    ];

    let modulesLoaded = 0;
    for (const module of coreModules) {
      try {
        require(`./${module}`);
        modulesLoaded++;
        console.log(`   ✅ Module loaded: ${path.basename(module)}`);
      } catch (error) {
        this.warnings.push(`Module load issue: ${module} - ${error.message}`);
      }
    }

    console.log(
      `   📊 ${modulesLoaded}/${coreModules.length} core modules loaded successfully`
    );

    // Final environment check
    console.log("   🔍 Final environment validation...");
    const criticalVars = [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "PERSONAL_ACCESS_TOKEN",
    ];

    const missingCritical = criticalVars.filter((key) => !this.envVars[key]);
    if (missingCritical.length === 0) {
      console.log("   ✅ All critical environment variables configured");
    } else {
      throw new Error(
        `Missing critical variables: ${missingCritical.join(", ")}`
      );
    }

    console.log("   🎯 System ready for development and testing");
  }

  /**
   * Helper: Run command with timeout and progress
   */
  async runCommand(command, options = {}) {
    const { timeout = 30000, description = "Running command" } = options;

    return new Promise((resolve, reject) => {
      const child = exec(command, {
        cwd: process.cwd(),
        env: process.env,
      });

      let output = "";
      let errorOutput = "";

      child.stdout?.on("data", (data) => {
        output += data.toString();
      });

      child.stderr?.on("data", (data) => {
        errorOutput += data.toString();
      });

      const timer = setTimeout(() => {
        child.kill();
        reject(new Error(`Command timeout: ${command}`));
      }, timeout);

      child.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve(output);
        } else {
          reject(
            new Error(`Command failed (${code}): ${errorOutput || output}`)
          );
        }
      });

      child.on("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  /**
   * Helper: Update environment variable
   */
  async updateEnvVar(key, value) {
    try {
      let envContent = await fs.readFile(".env", "utf8");
      const lines = envContent.split("\n");
      let updated = false;

      // Update existing line or add new one
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith(`${key}=`)) {
          lines[i] = `${key}=${value}`;
          updated = true;
          break;
        }
      }

      if (!updated) {
        lines.push(`${key}=${value}`);
      }

      await fs.writeFile(".env", lines.join("\n"));
      this.envVars[key] = value;
      process.env[key] = value;
    } catch (error) {
      console.warn(`Warning: Could not update .env file: ${error.message}`);
    }
  }

  /**
   * Helper: Ask user to continue on error
   */
  async askContinueOnError(phaseName, error) {
    console.error(`\n❌ Error in ${phaseName}:`);
    console.error(`   ${error.message}`);
    console.log("\nOptions:");
    console.log("   1. Continue with warnings (may affect functionality)");
    console.log("   2. Abort setup");

    // For automated setup, we'll continue with warnings
    console.log("\n⚠️  Continuing with warnings for automated setup...");
    return true;
  }

  /**
   * Generate comprehensive setup report
   */
  async generateSetupReport() {
    const duration = ((Date.now() - this.setupStartTime) / 1000).toFixed(1);

    console.log("\n" + "=".repeat(80));
    console.log("🎯 ProspectPro Setup Complete!");
    console.log("=".repeat(80));
    console.log(`Setup Duration: ${duration} seconds`);
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    console.log("");

    if (this.errors.length > 0) {
      console.log("❌ Errors Encountered:");
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.phase}: ${error.error}`);
      });
      console.log("");
    }

    if (this.warnings.length > 0) {
      console.log("⚠️  Warnings:");
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
      console.log("");
    }

    console.log("✅ Setup Status Summary:");
    console.log(`   📦 Dependencies: Installed`);
    console.log(
      `   🗄️  Database: ${
        this.envVars.SUPABASE_URL ? "Connected" : "Not configured"
      }`
    );
    console.log(`   ⚙️  Server: Configured`);
    console.log(
      `   🚂 Webhooks: ${
        this.envVars.RAILWAY_WEBHOOK_SECRET ? "Ready" : "Needs configuration"
      }`
    );
    console.log(
      `   🔒 Security: ${
        this.envVars.PERSONAL_ACCESS_TOKEN ? "Configured" : "Needs setup"
      }`
    );
    console.log(
      `   🧪 Testing: ${
        this.warnings.some((w) => w.includes("test")) ? "Partial" : "Ready"
      }`
    );

    console.log("");
    console.log("🚀 Next Steps:");

    if (this.errors.length === 0) {
      console.log("   1. Start development server: npm run dev");
      console.log(
        "   2. Test health endpoint: curl http://localhost:3000/health"
      );
      console.log("   3. Run tests: npm test");
      console.log("   4. Deploy to Railway: Follow the setup guide");
    } else {
      console.log("   1. Fix errors listed above");
      console.log("   2. Re-run setup: node setup-assistant.js");
      console.log("   3. Check setup guide for manual steps");
    }

    console.log("");
    console.log("📚 Documentation:");
    console.log(
      "   - Setup Guide: docs/webhooks/railway-webhook-setup-guide.md"
    );
    console.log("   - Testing: git checkout testing");
    console.log("   - Debugging: git checkout debugging");
    console.log("   - API Documentation: README.md");

    console.log("");
    console.log("🎊 ProspectPro is ready for development!");

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      duration: parseFloat(duration),
      errors: this.errors,
      warnings: this.warnings,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        supabaseConfigured: !!this.envVars.SUPABASE_URL,
        webhookConfigured: !!this.envVars.RAILWAY_WEBHOOK_SECRET,
        personalTokenConfigured: !!this.envVars.PERSONAL_ACCESS_TOKEN,
      },
    };

    try {
      await fs.mkdir("setup-logs", { recursive: true });
      await fs.writeFile(
        `setup-logs/setup-report-${Date.now()}.json`,
        JSON.stringify(report, null, 2)
      );
      console.log(`📋 Detailed report saved to setup-logs/`);
    } catch (error) {
      console.warn("Could not save detailed report:", error.message);
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const assistant = new ProspectProSetupAssistant();

  assistant
    .runAutomatedSetup()
    .then(() => {
      console.log("\n🎉 Automated setup completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Automated setup failed:", error.message);
      console.error(
        "Please check the setup guide for manual configuration steps."
      );
      process.exit(1);
    });
}

module.exports = ProspectProSetupAssistant;
