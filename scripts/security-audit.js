#!/usr/bin/env node

/**
 * Security Audit Script for ProspectPro
 * Scans for exposed secrets, validates security configuration,
 * and ensures compliance with Railway/Supabase security policies
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Security patterns to detect exposed secrets
const SECURITY_PATTERNS = {
  // Supabase secrets
  supabase_jwt: /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
  supabase_secret: /sb_secret_[a-zA-Z0-9]{40,}/g,
  supabase_publishable: /sb_publishable_[a-zA-Z0-9]{40,}/g,
  
  // Google API keys
  google_api: /AIza[0-9A-Za-z_-]{35}/g,
  
  // Generic API keys
  hunter_io: /[0-9a-f]{32,}/g,
  generic_secret: /(secret|key|token|password)[\s]*[:=][\s]*['"]\w+['"]/gi,
  
  // Hardcoded credentials
  hardcoded_password: /(password|pwd)[\s]*[:=][\s]*['"][^'"]{8,}['"]/gi,
  hardcoded_token: /(token|jwt)[\s]*[:=][\s]*['"][^'"]{20,}['"]/gi,
  
  // Database connection strings
  connection_string: /(postgres|mysql|mongodb):\/\/[^\s]+/gi,
};

// Files to scan (exclude node_modules, .git, etc.)
const SCAN_EXTENSIONS = ['.js', '.ts', '.json', '.html', '.css', '.md', '.env', '.yml', '.yaml'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'logs', 'temp', 'tmp'];
const EXCLUDE_FILES = ['package-lock.json', 'yarn.lock'];

class SecurityAuditor {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.findings = [];
    this.scannedFiles = 0;
    this.secretsFound = 0;
  }

  // Main audit function
  async audit() {
    log('magenta', '🔒 ProspectPro Security Audit Starting...');
    log('magenta', '==========================================');
    
    const startTime = Date.now();
    
    // Scan for exposed secrets in files
    await this.scanDirectory(this.rootDir);
    
    // Validate .env configuration
    this.validateEnvConfiguration();
    
    // Check for secure defaults
    this.checkSecureDefaults();
    
    // Validate Railway/Supabase compliance
    this.validateCloudCompliance();
    
    // Generate report
    this.generateSecurityReport(Date.now() - startTime);
    
    return this.findings.length === 0;
  }

  // Recursively scan directory for files
  async scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip excluded directories
        if (!EXCLUDE_DIRS.includes(item)) {
          await this.scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        // Skip excluded files
        if (!EXCLUDE_FILES.includes(item)) {
          this.scanFile(fullPath);
        }
      }
    }
  }

  // Scan individual file for security issues
  scanFile(filePath) {
    const ext = path.extname(filePath);
    if (!SCAN_EXTENSIONS.includes(ext)) return;
    
    this.scannedFiles++;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.rootDir, filePath);
      
      // Check for various security patterns
      for (const [patternName, regex] of Object.entries(SECURITY_PATTERNS)) {
        const matches = content.match(regex);
        if (matches) {
          this.secretsFound += matches.length;
          
          // Find line numbers for better reporting
          const lines = content.split('\n');
          matches.forEach(match => {
            const lineNum = lines.findIndex(line => line.includes(match)) + 1;
            
            this.findings.push({
              type: 'EXPOSED_SECRET',
              severity: this.getSecretSeverity(patternName),
              file: relativePath,
              line: lineNum,
              pattern: patternName,
              preview: match.substring(0, 20) + '...',
              description: `Potential ${patternName} found in ${relativePath}:${lineNum}`
            });
          });
        }
      }
      
      // Check for other security issues
      this.checkFileSecurityIssues(content, relativePath);
      
    } catch (error) {
      console.warn(`⚠️  Could not read file: ${filePath}`);
    }
  }

  // Get severity level for different secret types
  getSecretSeverity(patternName) {
    const criticalPatterns = ['supabase_jwt', 'supabase_secret', 'google_api', 'connection_string'];
    const highPatterns = ['supabase_publishable', 'hardcoded_password', 'hardcoded_token'];
    
    if (criticalPatterns.includes(patternName)) return 'CRITICAL';
    if (highPatterns.includes(patternName)) return 'HIGH';
    return 'MEDIUM';
  }

  // Check for other security issues in file content
  checkFileSecurityIssues(content, filePath) {
    // Check for debug information exposure
    if (content.includes('console.log') && filePath.endsWith('.js')) {
      const debugLogs = content.match(/console\.log.*['"].*(?:token|key|secret|password).*['"].*\)/gi);
      if (debugLogs) {
        this.findings.push({
          type: 'DEBUG_EXPOSURE',
          severity: 'MEDIUM',
          file: filePath,
          description: 'Potentially sensitive debug logging detected'
        });
      }
    }

    // Check for insecure HTTP URLs in production config
    if (content.includes('http://') && !filePath.includes('localhost')) {
      this.findings.push({
        type: 'INSECURE_HTTP',
        severity: 'LOW',
        file: filePath,
        description: 'Insecure HTTP URL detected (should use HTTPS)'
      });
    }

    // Check for commented-out secrets
    const commentedSecrets = content.match(/\/\/.*(?:key|token|secret|password).*[:=].*\w+/gi);
    if (commentedSecrets) {
      this.findings.push({
        type: 'COMMENTED_SECRET',
        severity: 'LOW',
        file: filePath,
        description: 'Potentially sensitive commented code detected'
      });
    }
  }

  // Validate .env configuration
  validateEnvConfiguration() {
    const envPath = path.join(this.rootDir, '.env');
    const envExamplePath = path.join(this.rootDir, '.env.example');
    
    // Check if .env exists and is properly configured
    if (fs.existsSync(envPath)) {
      this.findings.push({
        type: 'ENV_FILE_EXISTS',
        severity: 'HIGH',
        file: '.env',
        description: '.env file exists in repository (should be in .gitignore)'
      });
    }
    
    // Validate .env.example has proper security guidance
    if (fs.existsSync(envExamplePath)) {
      const envExample = fs.readFileSync(envExamplePath, 'utf8');
      
      if (!envExample.includes('sb_secret_') && !envExample.includes('sb_publishable_')) {
        this.findings.push({
          type: 'OUTDATED_ENV_FORMAT',
          severity: 'MEDIUM',
          file: '.env.example',
          description: 'Environment example uses deprecated Supabase key format'
        });
      }
      
      if (!envExample.includes('SECURITY') && !envExample.includes('security')) {
        this.findings.push({
          type: 'MISSING_SECURITY_GUIDANCE',
          severity: 'LOW',
          file: '.env.example',
          description: 'Missing security documentation in environment example'
        });
      }
    }
  }

  // Check for secure default configurations
  checkSecureDefaults() {
    // Check package.json for security configurations
    const packagePath = path.join(this.rootDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check Node.js version requirement
      if (!packageData.engines || !packageData.engines.node) {
        this.findings.push({
          type: 'MISSING_NODE_VERSION',
          severity: 'MEDIUM',
          file: 'package.json',
          description: 'Missing Node.js version requirement in package.json'
        });
      } else if (!packageData.engines.node.includes('20')) {
        this.findings.push({
          type: 'OUTDATED_NODE_VERSION',
          severity: 'MEDIUM',
          file: 'package.json',
          description: 'Node.js version should be 20+ for Supabase compatibility'
        });
      }
    }

    // Check for security headers in server configuration
    const serverPath = path.join(this.rootDir, 'server.js');
    if (fs.existsSync(serverPath)) {
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      if (!serverContent.includes('helmet') && !serverContent.includes('security')) {
        this.findings.push({
          type: 'MISSING_SECURITY_HEADERS',
          severity: 'MEDIUM',
          file: 'server.js',
          description: 'Consider adding security headers with helmet middleware'
        });
      }
    }
  }

  // Validate Railway and Supabase compliance
  validateCloudCompliance() {
    // Check Railway configuration
    const railwayTomlPath = path.join(this.rootDir, 'railway.toml');
    if (fs.existsSync(railwayTomlPath)) {
      const railwayConfig = fs.readFileSync(railwayTomlPath, 'utf8');
      
      if (!railwayConfig.includes('healthcheckPath')) {
        this.findings.push({
          type: 'MISSING_HEALTHCHECK',
          severity: 'MEDIUM',
          file: 'railway.toml',
          description: 'Missing healthcheck configuration for Railway deployment'
        });
      }
    }

    // Check for Supabase RLS policies documentation
    const schemaPath = path.join(this.rootDir, 'database', 'enhanced-supabase-schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      if (!schemaContent.includes('RLS') && !schemaContent.includes('row level security')) {
        this.findings.push({
          type: 'MISSING_RLS_POLICIES',
          severity: 'HIGH',
          file: 'database/enhanced-supabase-schema.sql',
          description: 'Missing Row Level Security policies in database schema'
        });
      }
    }
  }

  // Generate comprehensive security report
  generateSecurityReport(scanTime) {
    log('magenta', '\n🔒 Security Audit Report');
    log('magenta', '======================');
    
    log('blue', `📊 Scan Statistics:`);
    log('blue', `   Files Scanned: ${this.scannedFiles}`);
    log('blue', `   Scan Time: ${scanTime}ms`);
    log('blue', `   Total Issues: ${this.findings.length}`);
    
    if (this.findings.length === 0) {
      log('green', '\n✅ No security issues detected!');
      log('green', '✅ Repository appears secure for deployment');
      return;
    }

    // Group findings by severity
    const bySeverity = this.findings.reduce((acc, finding) => {
      acc[finding.severity] = acc[finding.severity] || [];
      acc[finding.severity].push(finding);
      return acc;
    }, {});

    // Report critical issues first
    Object.entries(bySeverity).forEach(([severity, findings]) => {
      const color = severity === 'CRITICAL' ? 'red' : severity === 'HIGH' ? 'red' : severity === 'MEDIUM' ? 'yellow' : 'blue';
      
      log(color, `\n🚨 ${severity} Issues (${findings.length}):`);
      findings.forEach((finding, index) => {
        log(color, `   ${index + 1}. ${finding.description}`);
        if (finding.file) {
          log(color, `      File: ${finding.file}${finding.line ? `:${finding.line}` : ''}`);
        }
        if (finding.preview) {
          log(color, `      Preview: ${finding.preview}`);
        }
      });
    });

    // Provide remediation guidance
    log('yellow', '\n💡 Remediation Steps:');
    
    if (bySeverity.CRITICAL || bySeverity.HIGH) {
      log('red', '   🚫 CRITICAL/HIGH: Remove exposed secrets immediately');
      log('red', '   🚫 Move all credentials to environment variables');
      log('red', '   🚫 Use Railway/Supabase secret management');
    }
    
    if (bySeverity.MEDIUM) {
      log('yellow', '   ⚠️  MEDIUM: Update deprecated configurations');
      log('yellow', '   ⚠️  Add security headers and validation');
      log('yellow', '   ⚠️  Review and update documentation');
    }
    
    if (bySeverity.LOW) {
      log('blue', '   ℹ️  LOW: Consider security improvements');
      log('blue', '   ℹ️  Add additional monitoring and logging');
    }

    log('magenta', '\n🔧 Next Steps:');
    log('magenta', '   1. Fix all CRITICAL and HIGH severity issues');
    log('magenta', '   2. Run: node scripts/validate-environment.js');
    log('magenta', '   3. Test deployment with: railway up');
    log('magenta', '   4. Monitor with admin dashboard');
  }
}

// Run security audit if executed directly
if (require.main === module) {
  const rootDir = process.argv[2] || process.cwd();
  
  const auditor = new SecurityAuditor(rootDir);
  auditor.audit()
    .then(isSecure => {
      if (isSecure) {
        log('green', '\n🎉 Security audit passed! Repository is secure for deployment.');
        process.exit(0);
      } else {
        log('red', '\n❌ Security audit failed! Fix issues before deployment.');
        process.exit(1);
      }
    })
    .catch(error => {
      log('red', `❌ Security audit error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { SecurityAuditor };