# ============================================================================
# ProspectPro Simple Production Initialization for Windows
# ============================================================================

Write-Host "ProspectPro Production Initialization (Windows)" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan

# Set working directory to project root
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "Project Root: $ProjectRoot" -ForegroundColor Yellow

# Check if .env exists
$EnvFile = Join-Path $ProjectRoot ".env"
if (-not (Test-Path $EnvFile)) {
    Write-Host "No .env file found. Creating minimal production environment..." -ForegroundColor Yellow
    
    # Create minimal .env for local development
    @"
# ProspectPro Local Production Environment
NODE_ENV=production
PORT=3100
HOST=0.0.0.0
ALLOW_DEGRADED_START=false

# Database Configuration (update with your values)
SUPABASE_URL=your_supabase_url_here
SUPABASE_SECRET_KEY=your_supabase_secret_key_here

# Budget and Performance Settings
DEFAULT_BUDGET_LIMIT=25.00
DAILY_BUDGET_LIMIT=100.00
MAX_CONCURRENT_REQUESTS=10
BATCH_SIZE=25
CACHE_TTL_SECONDS=3600
ENABLE_TTL_CACHE=true
ENABLE_BATCH_PROCESSING=true
ENABLE_COST_TRACKING=true
MIN_CONFIDENCE_SCORE=85
EXPORT_CONFIDENCE_THRESHOLD=90
ENABLE_REQUEST_VALIDATION=true
ENABLE_RATE_LIMITING=true
"@ | Out-File -FilePath $EnvFile -Encoding UTF8
    
    Write-Host "Created .env template at: $EnvFile" -ForegroundColor Green
    Write-Host "" 
    Write-Host "IMPORTANT: Update .env with your actual Supabase credentials!" -ForegroundColor Yellow
    Write-Host "   - SUPABASE_URL: Your project URL" -ForegroundColor White
    Write-Host "   - SUPABASE_SECRET_KEY: Your service role key" -ForegroundColor White
    Write-Host ""
}

# Validate Node.js version
try {
    $NodeVersion = node --version
    Write-Host "Node.js version: $NodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found. Please install Node.js 20+ first." -ForegroundColor Red
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm install failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependencies installed" -ForegroundColor Green
}

# Check if server is already running
try {
    $Response = Invoke-RestMethod -Uri "http://localhost:3100/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($Response) {
        Write-Host "Server already running on port 3100" -ForegroundColor Yellow
        Write-Host "Access at: http://localhost:3100" -ForegroundColor Cyan
        exit 0
    }
} catch {
    # Server not running, continue
}

Write-Host ""
Write-Host "Starting ProspectPro Production Server..." -ForegroundColor Green
Write-Host "   Port: 3100" -ForegroundColor White
Write-Host "   Environment: Production" -ForegroundColor White  
Write-Host "   Access: http://localhost:3100" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
try {
    npm start
} catch {
    Write-Host "Failed to start server: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}