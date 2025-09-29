param([switch]$Help)

if ($Help) {
    Write-Host ""
    Write-Host "ProspectPro Production Server" -ForegroundColor Green
    Write-Host "============================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access the UI after startup:"
    Write-Host "  Main Application: http://localhost:3000"
    Write-Host "  Business Discovery: http://localhost:3000/discovery"
    Write-Host "  Admin Panel: http://localhost:3000/admin"
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "ProspectPro Production Server" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCheck) {
    $nodeVersion = & node --version
    Write-Host "Node.js $nodeVersion found" -ForegroundColor Green
}
else {
    Write-Host "Node.js not found - install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check environment
Write-Host "Checking environment..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "your-project-ref" -or $envContent -match "your_service_role_key_here") {
        Write-Host ""
        Write-Host "CONFIGURATION REQUIRED:" -ForegroundColor Yellow
        Write-Host "Edit .env file with your Supabase credentials" -ForegroundColor White
        Write-Host "Then run this script again" -ForegroundColor White
        Write-Host ""
        exit 0
    }
    Write-Host "Environment configured" -ForegroundColor Green
}
else {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from template - edit with real credentials" -ForegroundColor Yellow
    exit 0
}

# Install dependencies
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    & npm install
}
Write-Host "Dependencies ready" -ForegroundColor Green

# Start server
Write-Host ""
Write-Host "Starting Production Server..." -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  Main UI: http://localhost:3100" -ForegroundColor White
Write-Host "  Business Discovery: http://localhost:3100/discovery" -ForegroundColor White
Write-Host "  Results: http://localhost:3100/results" -ForegroundColor White
Write-Host "  Admin: http://localhost:3100/admin" -ForegroundColor White
Write-Host ""
Write-Host "Features:" -ForegroundColor Cyan
Write-Host "  Zero fake data guarantee" -ForegroundColor White
Write-Host "  Real-time lead discovery" -ForegroundColor White
Write-Host "  Multi-source validation" -ForegroundColor White
Write-Host "  Cost tracking" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

$env:NODE_ENV = "production"
& node server.js