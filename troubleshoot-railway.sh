#!/bin/bash
# Railway Deployment Troubleshooting Script
# This script will help identify and fix deployment issues

echo "🚀 ProspectPro Railway Deployment Troubleshooting"
echo "=================================================="

echo ""
echo "📋 Checking Node.js Environment:"
node --version
npm --version

echo ""
echo "📋 Checking Package.json Dependencies:"
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
    npm list --depth=0 2>/dev/null || echo "⚠️ Some packages may be missing"
else
    echo "❌ package.json not found"
fi

echo ""
echo "📋 Checking Critical Files:"
files=(
    "server.js"
    "api/dashboard-export.js"
    "modules/api-clients/prospectpro-metrics-client.js"
    "public/monitoring/index.html"
    "config/supabase.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "📋 Testing Module Imports:"
node -e "
try {
    console.log('Testing ProspectProMetricsClient import...');
    const ProspectProMetricsClient = require('./modules/api-clients/prospectpro-metrics-client');
    console.log('✅ ProspectProMetricsClient imported successfully');
    
    console.log('Testing dashboard-export import...');
    const { createDashboardExportRoutes } = require('./api/dashboard-export');
    console.log('✅ Dashboard export routes imported successfully');
    
    console.log('Testing Supabase config import...');
    const { testConnection } = require('./config/supabase');
    console.log('✅ Supabase config imported successfully');
    
    console.log('✅ All critical modules imported successfully');
} catch(e) {
    console.error('❌ Import error:', e.message);
    console.error('Stack:', e.stack);
    process.exit(1);
}
" || echo "❌ Module import test failed"

echo ""
echo "📋 Environment Variables Check:"
required_vars=(
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "GOOGLE_PLACES_API_KEY"
    "SCRAPINGDOG_API_KEY"
    "HUNTER_IO_API_KEY"
    "NEVERBOUNCE_API_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -n "${!var}" ]; then
        echo "✅ $var is set"
    else
        echo "⚠️ $var is not set"
    fi
done

echo ""
echo "📋 Starting Server Test:"
echo "Attempting to start server for 5 seconds..."
timeout 5s node server.js || echo "Server test completed (expected timeout)"

echo ""
echo "🎯 Deployment Troubleshooting Complete"
echo "If imports work locally but fail on Railway, check:"
echo "1. Node.js version compatibility (Railway vs local)"
echo "2. Case sensitivity in file paths"
echo "3. Missing dependencies in package.json"
echo "4. Environment variables configuration"