# ProspectPro Railway Deployment Troubleshooting
# PowerShell version for Windows

Write-Host "🚀 ProspectPro Railway Deployment Troubleshooting" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Checking Node.js Environment:" -ForegroundColor Blue
node --version
npm --version
Write-Host ""

Write-Host "📋 Checking Critical Files:" -ForegroundColor Blue
$files = @(
    "server.js",
    "api\dashboard-export.js",
    "modules\api-clients\prospectpro-metrics-client.js",
    "public\monitoring\index.html",
    "config\supabase.js"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    }
    else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "📋 Testing Module Imports:" -ForegroundColor Blue
$importTest = @"
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
    process.exit(1);
}
"@

node -e $importTest
Write-Host ""

Write-Host "📋 Environment Variables Check:" -ForegroundColor Blue
$requiredVars = @(
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY", 
    "GOOGLE_PLACES_API_KEY",
    "SCRAPINGDOG_API_KEY",
    "HUNTER_IO_API_KEY",
    "NEVERBOUNCE_API_KEY"
)

foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        Write-Host "✅ $var is set" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ $var is not set" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "🎯 Troubleshooting Complete!" -ForegroundColor Green
Write-Host "If imports work locally but fail on Railway:" -ForegroundColor Yellow
Write-Host "1. Check Node.js version compatibility" -ForegroundColor Gray
Write-Host "2. Verify case sensitivity in file paths" -ForegroundColor Gray
Write-Host "3. Ensure all dependencies in package.json" -ForegroundColor Gray
Write-Host "4. Confirm environment variables are set" -ForegroundColor Gray