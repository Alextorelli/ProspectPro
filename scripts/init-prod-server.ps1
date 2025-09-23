# ============================================================================
# ProspectPro Production Server Initialization - PowerShell Edition v2.0
# Windows PowerShell Compatible Production Deployment
# ============================================================================

param(
    [switch]$Help,
    [switch]$SkipValidation,
    [switch]$Force
)

# Set error handling
$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $ProjectRoot ".env"
$LogFile = Join-Path $ProjectRoot "startup.log"

Write-Host "🚀 ProspectPro Production Server Initialization v2.0" -ForegroundColor Green
Write-Host "=============================================================="
Write-Host "🎯 Windows PowerShell Production Deployment" -ForegroundColor Cyan
Write-Host "🔒 Supabase Vault Integration with Zero Manual Configuration" -ForegroundColor Yellow
Write-Host ""

if ($Help) {
    Write-Host "Usage: .\scripts\init-prod-server.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Production Server Initialization for Windows"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Help              Show this help message"
    Write-Host "  -SkipValidation    Skip environment validation (not recommended)"
    Write-Host "  -Force             Force initialization even if validation fails"
    Write-Host ""
    Write-Host "Requirements:"
    Write-Host "  - Valid .env file with Supabase credentials"
    Write-Host "  - Node.js v20+ installed"
    Write-Host "  - Supabase project with ProspectPro database schema"
    Write-Host "  - API keys configured in Supabase Vault"
    exit 0
}

Write-Host "📋 Project root: $ProjectRoot" -ForegroundColor Gray
Write-Host "📁 Environment file: $EnvFile" -ForegroundColor Gray
Write-Host "📄 Log file: $LogFile" -ForegroundColor Gray
Write-Host ""

# Initialize log file
Write-Host "🔧 Initializing startup log..." -ForegroundColor Yellow
"# ProspectPro Production Startup Log" | Out-File -FilePath $LogFile -Encoding UTF8
"# Started: $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')" | Add-Content -Path $LogFile
"# Windows PowerShell Production Deployment" | Add-Content -Path $LogFile
"# ==============================================" | Add-Content -Path $LogFile

# Function to check if .env file exists and is valid
function Test-EnvironmentFile {
    Write-Host "🔍 Checking for production .env file..." -ForegroundColor Yellow
    
    if (-not (Test-Path $EnvFile)) {
        Write-Host "❌ No .env file found" -ForegroundColor Red
        Write-Host "   Creating from template..." -ForegroundColor Yellow
        
        # Copy template and prompt for manual configuration
        Copy-Item "$ProjectRoot\.env.example" $EnvFile
        Write-Host "✅ Template .env file created" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  MANUAL CONFIGURATION REQUIRED:" -ForegroundColor Yellow
        Write-Host "   1. Edit .env file with your real Supabase credentials:" -ForegroundColor White
        Write-Host "      - Replace 'your-project-ref.supabase.co' with your actual Supabase URL" -ForegroundColor White
        Write-Host "      - Replace 'your_service_role_key_here' with your actual service role key" -ForegroundColor White
        Write-Host ""
        Write-Host "   2. Configure API keys in Supabase Vault:" -ForegroundColor White
        Write-Host "      - Go to Supabase Dashboard → Settings → Vault" -ForegroundColor White
        Write-Host "      - Add: prospectpro_GOOGLE_PLACES_API_KEY" -ForegroundColor White
        Write-Host "      - Add: prospectpro_HUNTER_IO_API_KEY" -ForegroundColor White
        Write-Host "      - Add: prospectpro_NEVERBOUNCE_API_KEY" -ForegroundColor White
        Write-Host ""
        Write-Host "   3. Run this script again after configuration" -ForegroundColor White
        return $false
    }
    
    # Check for template values
    $envContent = Get-Content $EnvFile -Raw
    $hasTemplateValues = $envContent -match "your_supabase.*_here|your_service_role_key_here|your-project-ref\.supabase\.co"
    
    if ($hasTemplateValues) {
        Write-Host "⚠️  .env file contains template values" -ForegroundColor Yellow
        Write-Host "   Edit .env file and replace template values with real Supabase credentials" -ForegroundColor White
        return $false
    }
    
    Write-Host "✅ Production .env file ready (core credentials configured)" -ForegroundColor Green
    return $true
}

# Function to validate environment variables
function Test-EnvironmentVariables {
    if ($SkipValidation) {
        Write-Host "⚠️  Skipping environment validation (not recommended)" -ForegroundColor Yellow
        return $true
    }
    
    Write-Host "🔍 Validating production environment..." -ForegroundColor Yellow
    
    # Load environment variables
    if (Test-Path $EnvFile) {
        Get-Content $EnvFile | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.+)$') {
                [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
            }
        }
    }
    
    # Check required variables
    $requiredVars = @('SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'NODE_ENV')
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if (-not [System.Environment]::GetEnvironmentVariable($var, 'Process')) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "❌ Missing required environment variables:" -ForegroundColor Red
        $missingVars | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
        return $false
    }
    
    # Validate Supabase URL format
    $supabaseUrl = [System.Environment]::GetEnvironmentVariable('SUPABASE_URL', 'Process')
    if ($supabaseUrl -match '^https://.*\.supabase\.co$') {
        Write-Host "✅ Supabase URL format validated" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Supabase URL format may be incorrect: $supabaseUrl" -ForegroundColor Yellow
    }
    
    Write-Host "✅ Environment validation passed" -ForegroundColor Green
    return $true
}

# Function to test Node.js version
function Test-NodeVersion {
    Write-Host "🔍 Checking Node.js version..." -ForegroundColor Yellow
    
    try {
        $nodeVersion = node --version
        $versionNumber = [System.Version]($nodeVersion -replace '^v', '')
        
        if ($versionNumber.Major -ge 20) {
            Write-Host "✅ Node.js version $nodeVersion is compatible" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "❌ Node.js version $nodeVersion is too old (requires v20+)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Node.js not found or not accessible" -ForegroundColor Red
        return $false
    }
}

# Function to test Supabase connection
function Test-SupabaseConnection {
    Write-Host "🔍 Testing Supabase connection..." -ForegroundColor Yellow
    
    try {
        # Use Node.js to test connection
        $testScript = @"
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SECRET_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials');
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test basic connection
        const { data, error } = await supabase
            .from('enhanced_leads')
            .select('count')
            .limit(1);
        
        if (error && !error.message.includes('relation "enhanced_leads" does not exist')) {
            throw error;
        }
        
        console.log('✅ Supabase connection successful');
        process.exit(0);
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
"@
        
        $testScript | Out-File -FilePath "$ProjectRoot\temp-connection-test.js" -Encoding UTF8
        
        $result = node "$ProjectRoot\temp-connection-test.js" 2>&1
        Remove-Item "$ProjectRoot\temp-connection-test.js" -Force
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Supabase connection validated" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "❌ Supabase connection failed: $result" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Connection test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to start production server
function Start-ProductionServer {
    Write-Host ""
    Write-Host "🌐 Starting ProspectPro production server v3.0..." -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Server will be available at:" -ForegroundColor Cyan
    Write-Host "   • Main UI: http://localhost:3000" -ForegroundColor White
    Write-Host "   • API: http://localhost:3000/api" -ForegroundColor White
    Write-Host "   • Health: http://localhost:3000/health" -ForegroundColor White
    Write-Host "   • Diagnostics: http://localhost:3000/diag" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Production Features Enabled:" -ForegroundColor Cyan
    Write-Host "   • Zero fake data guarantee" -ForegroundColor White
    Write-Host "   • Real-time cost tracking" -ForegroundColor White
    Write-Host "   • Multi-source API validation" -ForegroundColor White
    Write-Host "   • Comprehensive monitoring" -ForegroundColor White
    Write-Host ""
    
    # Set production environment
    [System.Environment]::SetEnvironmentVariable('NODE_ENV', 'production', 'Process')
    
    # Start server
    try {
        & node server.js
    }
    catch {
        Write-Host "❌ Server failed to start: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Main execution
Write-Host "🔒 Production Mode: Comprehensive Validation Required" -ForegroundColor Yellow
Write-Host ""

try {
    # Step 1: Check Node.js version
    if (-not (Test-NodeVersion)) {
        if (-not $Force) {
            Write-Host "❌ Node.js validation failed - install Node.js v20+" -ForegroundColor Red
            exit 1
        }
    }
    
    # Step 2: Validate environment file
    if (-not (Test-EnvironmentFile)) {
        if (-not $Force) {
            Write-Host "❌ Environment file validation failed" -ForegroundColor Red
            Write-Host "   Complete the manual configuration steps above and run again" -ForegroundColor Yellow
            exit 1
        }
    }
    
    # Step 3: Validate environment variables
    if (-not (Test-EnvironmentVariables)) {
        if (-not $Force) {
            Write-Host "❌ Environment validation failed" -ForegroundColor Red
            exit 1
        }
    }
    
    # Step 4: Test Supabase connection
    if (-not (Test-SupabaseConnection)) {
        if (-not $Force) {
            Write-Host "❌ Database connection failed" -ForegroundColor Red
            Write-Host "   Verify Supabase credentials and database schema" -ForegroundColor Yellow
            exit 1
        }
    }
    
    # All validations passed
    Write-Host ""
    Write-Host "🚀 All systems validated - starting production server!" -ForegroundColor Green
    Write-Host "====================================================" -ForegroundColor Green
    
    Start-ProductionServer
    
}
catch {
    Write-Host "❌ Production server initialization failed: $($_.Exception.Message)" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Add-Content -Path $LogFile -Encoding UTF8
    exit 1
}