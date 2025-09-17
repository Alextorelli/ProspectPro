/**
 * Railway Deployment Health Check
 * Run this after Railway deployment to verify everything works
 */

const https = require('https');
const http = require('http');

class RailwayHealthChecker {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.results = [];
  }

  async checkEndpoint(path, expectedStatus = 200, description) {
    return new Promise((resolve) => {
      const url = `${this.baseUrl}${path}`;
      const protocol = url.startsWith('https') ? https : http;
      
      console.log(`🔍 Testing: ${description}`);
      console.log(`   URL: ${url}`);
      
      const startTime = Date.now();
      
      const req = protocol.get(url, (res) => {
        const responseTime = Date.now() - startTime;
        const success = res.statusCode === expectedStatus;
        
        const result = {
          path,
          url,
          description,
          status: res.statusCode,
          expected: expectedStatus,
          success,
          responseTime,
          contentLength: res.headers['content-length'] || 'unknown'
        };
        
        this.results.push(result);
        
        console.log(`   ${success ? '✅' : '❌'} Status: ${res.statusCode} (expected ${expectedStatus})`);
        console.log(`   ⏱️  Response time: ${responseTime}ms`);
        console.log(`   📊 Content length: ${result.contentLength} bytes`);
        console.log('');
        
        resolve(result);
      });
      
      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        const result = {
          path,
          url,
          description,
          status: 'ERROR',
          expected: expectedStatus,
          success: false,
          responseTime,
          error: error.message
        };
        
        this.results.push(result);
        
        console.log(`   ❌ Error: ${error.message}`);
        console.log(`   ⏱️  Failed after: ${responseTime}ms`);
        console.log('');
        
        resolve(result);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        const result = {
          path,
          url,
          description,
          status: 'TIMEOUT',
          expected: expectedStatus,
          success: false,
          responseTime: 10000,
          error: 'Request timeout (10s)'
        };
        
        this.results.push(result);
        console.log('   ❌ Timeout: Request took longer than 10 seconds');
        console.log('');
        resolve(result);
      });
    });
  }

  async runHealthCheck() {
    console.log('🚀 Railway Deployment Health Check');
    console.log('====================================');
    console.log(`Target: ${this.baseUrl}`);
    console.log('');
    
    // Core endpoints
    await this.checkEndpoint('/health', 200, 'Server Health Check');
    await this.checkEndpoint('/', 200, 'Main Application');
    await this.checkEndpoint('/monitoring', 200, 'Monitoring Dashboard');
    
    // API endpoints
    await this.checkEndpoint('/api/status', 200, 'API Status Check');
    await this.checkEndpoint('/api/dashboard/export/snapshot', 200, 'Dashboard Export');
    
    // Static files
    await this.checkEndpoint('/monitoring/dashboard-style.css', 200, 'Dashboard CSS');
    await this.checkEndpoint('/monitoring/dashboard-app.js', 200, 'Dashboard JavaScript');
    
    this.generateReport();
  }
  
  generateReport() {
    console.log('📊 Health Check Summary');
    console.log('=======================');
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    
    const avgResponseTime = this.results
      .filter(r => typeof r.responseTime === 'number')
      .reduce((sum, r) => sum + r.responseTime, 0) / totalTests;
    
    console.log(`⏱️  Average Response Time: ${Math.round(avgResponseTime)}ms`);
    console.log('');
    
    if (failedTests === 0) {
      console.log('🎉 ALL TESTS PASSED! Deployment is healthy.');
      console.log('');
      console.log('🔗 Your ProspectPro application is ready:');
      console.log(`   Main App: ${this.baseUrl}`);
      console.log(`   Monitoring: ${this.baseUrl}/monitoring`);
      console.log(`   Health: ${this.baseUrl}/health`);
    } else {
      console.log('⚠️  Some tests failed. Check the issues above.');
      console.log('');
      console.log('Failed endpoints:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   ❌ ${r.description}: ${r.error || `Status ${r.status} (expected ${r.expected})`}`);
        });
    }
    
    console.log('');
    console.log('📋 Next steps:');
    if (passedTests === totalTests) {
      console.log('   1. Test lead generation workflow');
      console.log('   2. Configure monitoring alerts');
      console.log('   3. Set up cost budgets');
      console.log('   4. Update documentation with production URLs');
    } else {
      console.log('   1. Check Railway deployment logs: railway logs');
      console.log('   2. Verify environment variables are set');
      console.log('   3. Check Railway service status');
      console.log('   4. Redeploy if necessary: railway up');
    }
  }
}

// Usage
const baseUrl = process.argv[2];

if (!baseUrl) {
  console.log('Usage: node railway-health-check.js <base-url>');
  console.log('Example: node railway-health-check.js https://your-app.railway.app');
  console.log('');
  console.log('For localhost testing: node railway-health-check.js http://localhost:3000');
  process.exit(1);
}

const checker = new RailwayHealthChecker(baseUrl);
checker.runHealthCheck().catch(console.error);