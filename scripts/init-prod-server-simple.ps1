# ============================================================================
# ProspectPro Production Server Initialization - PowerShell Simple Edition
# Windows PowerShell Compatible Production Deployment
# ============================================================================

param(
    [switch]$Help,
    [switch]$Force
)

# Set error handling
$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $ProjectRoot ".env"
$EnvExample = Join-Path $ProjectRoot ".env.example"

Write-Host ""
Write-Host "🚀 ProspectPro Production Server Initialization" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

if ($Help) {
    Write-Host "Usage: .\scripts\init-prod-server-simple.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Production Server Initialization for Windows"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Help         Show this help message"
    Write-Host "  -Force        Force initialization even if validation fails"
    Write-Host ""
    Write-Host "Requirements:"
    Write-Host "  - Valid .env file with Supabase credentials"
    Write-Host "  - Node.js v20+ installed"
    Write-Host "  - Supabase project with ProspectPro database schema"
    Write-Host ""
    Write-Host "🎯 After server starts, access the UI at:"
    Write-Host "   • Main Application: http://localhost:3000"
    Write-Host "   • Business Discovery: http://localhost:3000/discovery"
    Write-Host "   • Admin Dashboard: http://localhost:3000/admin"
    Write-Host ""
    exit 0
}

Write-Host "📋 Project: $ProjectRoot" -ForegroundColor Gray
Write-Host ""

# Function to check Node.js version
function Test-NodeVersion {
    Write-Host "🔍 Checking Node.js version..." -ForegroundColor Yellow
    
    try {
        $nodeOutput = node --version 2>&1
        if ($nodeOutput -match "v(\d+)\.") {
            $majorVersion = [int]$matches[1]
            if ($majorVersion -ge 20) {
                Write-Host "✅ Node.js $nodeOutput is compatible" -ForegroundColor Green
                return $true
            } else {
                Write-Host "❌ Node.js $nodeOutput is too old (requires v20+)" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "❌ Could not determine Node.js version" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Node.js not found - please install Node.js v20+" -ForegroundColor Red
        return $false
    }
}

# Function to setup environment file
function Initialize-Environment {
    Write-Host "🔍 Checking environment configuration..." -ForegroundColor Yellow
    
    # Check if .env exists
    if (-not (Test-Path $EnvFile)) {
        Write-Host "⚠️  No .env file found, creating from template..." -ForegroundColor Yellow
        
        if (Test-Path $EnvExample) {
            Copy-Item $EnvExample $EnvFile
            Write-Host "✅ Template .env file created" -ForegroundColor Green
        } else {
            Write-Host "❌ No .env.example template found" -ForegroundColor Red
            return $false
        }
    }
    
    # Check for template values in .env
    $envContent = Get-Content $EnvFile -Raw -ErrorAction SilentlyContinue
    if ($envContent -and ($envContent.Contains("your-project-ref.supabase.co") -or $envContent.Contains("your_service_role_key_here"))) {
        Write-Host ""
        Write-Host "⚠️  CONFIGURATION REQUIRED:" -ForegroundColor Yellow
        Write-Host "   Edit .env file with your real Supabase credentials:" -ForegroundColor White
        Write-Host "   1. Replace 'your-project-ref.supabase.co' with your Supabase project URL" -ForegroundColor White
        Write-Host "   2. Replace 'your_service_role_key_here' with your service role key" -ForegroundColor White
        Write-Host ""
        Write-Host "   Then run this script again" -ForegroundColor White
        Write-Host ""
        
        # Show the file path for easy editing
        Write-Host "📝 Edit this file: $EnvFile" -ForegroundColor Cyan
        return $false
    }
    
    Write-Host "✅ Environment file configured" -ForegroundColor Green
    return $true
}

# Function to test basic requirements
function Test-Requirements {
    Write-Host "🔍 Testing production requirements..." -ForegroundColor Yellow
    
    # Test npm packages
    if (-not (Test-Path (Join-Path $ProjectRoot "node_modules"))) {
        Write-Host "⚠️  Node modules not found, installing..." -ForegroundColor Yellow
        try {
            npm install
            Write-Host "✅ Dependencies installed" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "✅ Node modules found" -ForegroundColor Green
    }
    
    return $true
}

# Function to start production server
function Start-ProductionServer {
    Write-Host ""
    Write-Host "🌐 Starting ProspectPro Production Server..." -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Server will be available at:" -ForegroundColor Cyan
    Write-Host "   • Main UI: http://localhost:3000" -ForegroundColor White
    Write-Host "   • Business Discovery: http://localhost:3000/discovery" -ForegroundColor White
    Write-Host "   • Admin Dashboard: http://localhost:3000/admin" -ForegroundColor White
    Write-Host "   • Health Check: http://localhost:3000/health" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 Campaign Features:" -ForegroundColor Cyan
    Write-Host "   • Zero fake data guarantee" -ForegroundColor White
    Write-Host "   • Real-time cost tracking" -ForegroundColor White
    Write-Host "   • Multi-source validation" -ForegroundColor White
    Write-Host "   • Quality scoring 0-100%" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host ""
    
    # Set production environment
    $env:NODE_ENV = "production"
    
    # Start the server
    try {
        node server.js
    } catch {
        Write-Host "❌ Server startup failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Main execution
try {
    # Step 1: Check Node.js
    if (-not (Test-NodeVersion) -and -not $Force) {
        Write-Host "❌ Node.js validation failed - install Node.js v20+ from https://nodejs.org" -ForegroundColor Red
        exit 1
    }
    
    # Step 2: Setup environment
    if (-not (Initialize-Environment) -and -not $Force) {
        Write-Host "❌ Environment setup required - complete configuration and run again" -ForegroundColor Red
        exit 1
    }
    
    # Step 3: Check requirements
    if (-not (Test-Requirements) -and -not $Force) {
        Write-Host "❌ Requirements check failed" -ForegroundColor Red
        exit 1
    }
    
    # Step 4: Start server
    Write-Host "🚀 All checks passed - launching production server!" -ForegroundColor Green
    Start-ProductionServer
    
} catch {
    Write-Host ""
    Write-Host "❌ Production initialization failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}