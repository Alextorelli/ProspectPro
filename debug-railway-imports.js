/**
 * Railway Deployment Fix for Module Resolution
 * This script helps identify and fix module import issues in production
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 Railway Module Resolution Diagnostics');
console.log('==========================================');

// Get current working directory
const cwd = process.cwd();
console.log('Current working directory:', cwd);

// Check critical paths
const criticalPaths = [
  'api/dashboard-export.js',
  'modules/api-clients/prospectpro-metrics-client.js',
  'server.js',
  'package.json'
];

console.log('\n📁 File System Check:');
criticalPaths.forEach(filePath => {
  const fullPath = path.join(cwd, filePath);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${filePath} ${exists ? 'exists' : 'missing'}`);
  
  if (exists && filePath.endsWith('.js')) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const requireMatches = content.match(/require\(['"`]([^'"`]+)['"`]\)/g);
      if (requireMatches) {
        console.log(`   📋 Requires: ${requireMatches.slice(0, 3).join(', ')}${requireMatches.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.log(`   ⚠️ Error reading file: ${error.message}`);
    }
  }
});

console.log('\n🔧 Testing Module Resolution:');

// Test the problematic import from dashboard-export.js
const dashboardExportPath = path.join(cwd, 'api', 'dashboard-export.js');
const expectedMetricsPath = path.join(cwd, 'modules', 'api-clients', 'prospectpro-metrics-client.js');

console.log('Dashboard export file:', dashboardExportPath);
console.log('Expected metrics client file:', expectedMetricsPath);

// Test relative path resolution
const relativePathFromDashboard = '../modules/api-clients/prospectpro-metrics-client';
const resolvedPath = path.resolve(path.dirname(dashboardExportPath), relativePathFromDashboard + '.js');

console.log('Relative path from dashboard-export.js:', relativePathFromDashboard);
console.log('Resolved absolute path:', resolvedPath);
console.log('Expected path matches resolved:', resolvedPath === expectedMetricsPath);
console.log('Resolved file exists:', fs.existsSync(resolvedPath));

// Test the actual import
console.log('\n⚡ Testing Actual Imports:');
try {
  console.log('Testing ProspectProMetricsClient import...');
  const ProspectProMetricsClient = require('./modules/api-clients/prospectpro-metrics-client');
  console.log('✅ ProspectProMetricsClient imported successfully');
  console.log('   Type:', typeof ProspectProMetricsClient);
  console.log('   Constructor:', ProspectProMetricsClient.name);
} catch (error) {
  console.log('❌ ProspectProMetricsClient import failed:', error.message);
  console.log('   Stack:', error.stack);
}

try {
  console.log('Testing dashboard-export import...');
  const { createDashboardExportRoutes } = require('./api/dashboard-export');
  console.log('✅ Dashboard export routes imported successfully');
  console.log('   Type:', typeof createDashboardExportRoutes);
} catch (error) {
  console.log('❌ Dashboard export import failed:', error.message);
  console.log('   Stack:', error.stack);
}

console.log('\n🎯 Environment Information:');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');

console.log('\n📋 Module Resolution Paths:');
console.log('require.main.filename:', require.main.filename);
console.log('__dirname equivalent:', __dirname);
console.log('Module paths:', require.main.paths.slice(0, 3));

console.log('\n✅ Diagnostics Complete!');