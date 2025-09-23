# ProspectPro Production Server Startup
param(
    [switch]$Help
)

if ($Help) {
    Write-Host ""
    Write-Host "🚀 ProspectPro Production Server" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "This script will:"
    Write-Host "  1. Check Node.js version (requires v20+)"
    Write-Host "  2. Set up environment file if needed"
    Write-Host "  3. Install dependencies"
    Write-Host "  4. Start the production server"
    Write-Host ""
    Write-Host "🎯 Access the UI after startup:"
    Write-Host "   • Main Application: http://localhost:3000"
    Write-Host "   • Business Discovery: http://localhost:3000/discovery"
    Write-Host "   • Admin Panel: http://localhost:3000/admin"
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "🚀 ProspectPro Production Server" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Check Node.js
Write-Host "🔍 Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found - install Node.js v20+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check environment file
Write-Host "🔍 Checking environment file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Created .env from template" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  CONFIGURATION REQUIRED:" -ForegroundColor Yellow
        Write-Host "   Edit .env file with your Supabase credentials:" -ForegroundColor White
        Write-Host "   1. Replace template URLs with your real Supabase project URL" -ForegroundColor White
        Write-Host "   2. Replace template keys with your real service role key" -ForegroundColor White
        Write-Host ""
        Write-Host "   Then run this script again" -ForegroundColor White
        exit 0
    } else {
        Write-Host "❌ No .env.example found" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Environment file found" -ForegroundColor Green
}

# Check for template values
$envContent = Get-Content ".env" -Raw
if ($envContent.Contains("your-project-ref") -or $envContent.Contains("your_service_role_key_here")) {
    Write-Host ""
    Write-Host "⚠️  Environment file contains template values" -ForegroundColor Yellow
    Write-Host "   Edit .env file with real Supabase credentials and run again" -ForegroundColor White
    Write-Host ""
    exit 0
}

# Install dependencies
Write-Host "🔍 Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies found" -ForegroundColor Green
}

# Start server
Write-Host ""
Write-Host "🌐 Starting ProspectPro Production Server..." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Access the application:" -ForegroundColor Cyan
Write-Host "   • Main UI: http://localhost:3000" -ForegroundColor White
Write-Host "   • Business Discovery: http://localhost:3000/discovery" -ForegroundColor White
Write-Host "   • Results & Export: http://localhost:3000/results" -ForegroundColor White
Write-Host "   • Admin Dashboard: http://localhost:3000/admin" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Campaign Features Available:" -ForegroundColor Cyan
Write-Host "   • Zero fake data guarantee" -ForegroundColor White
Write-Host "   • Real-time lead discovery" -ForegroundColor White
Write-Host "   • Multi-source validation" -ForegroundColor White
Write-Host "   • Cost tracking & budgets" -ForegroundColor White
Write-Host "   • Quality scoring" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop server" -ForegroundColor Gray
Write-Host ""

$env:NODE_ENV = "production"
node server.js