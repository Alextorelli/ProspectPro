#!/bin/bash

# ProspectPro Production Environment Setup
# Sets up production environment with proper configuration and removes development references

set -e

echo "🚀 ProspectPro Production Environment Setup"
echo "========================================"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the ProspectPro root directory."
    exit 1
fi

# Create production environment file template
echo "📝 Creating production environment configuration..."

cat > .env.production << 'EOF'
# ProspectPro Production Environment Configuration
NODE_ENV=production
PORT=3000

# Supabase Configuration (REQUIRED)
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SECRET_KEY=your_supabase_secret_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# API Keys for Lead Discovery (REQUIRED)
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
HUNTER_API_KEY=your_hunter_io_api_key_here
NEVERBOUNCE_API_KEY=your_neverbounce_api_key_here

# Government API Integration (OPTIONAL)
CALIFORNIA_SOS_API_KEY=your_california_sos_api_key_here
WASHINGTON_STATE_API_KEY=your_washington_state_api_key_here
OREGON_STATE_API_KEY=your_oregon_state_api_key_here

# Production Security
PERSONAL_ACCESS_TOKEN=your_secure_admin_token_here
JWT_SECRET=your_jwt_secret_for_authentication_here

# Production Features
ALLOW_DEGRADED_START=false
SKIP_AUTH_IN_DEV=false
ENABLE_METRICS=true
ENABLE_TRACING=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Budget Controls
DEFAULT_BUDGET_LIMIT=50.00
MAX_SINGLE_SEARCH_BUDGET=10.00
EOF

echo "✅ Production environment template created: .env.production"
echo ""

# Create production startup script
echo "📝 Creating production startup script..."

cat > start-production.sh << 'EOF'
#!/bin/bash

# ProspectPro Production Startup Script
echo "🚀 Starting ProspectPro in Production Mode..."

# Load production environment
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production not found. Run setup-production.sh first."
    exit 1
fi

# Copy production env to active .env
cp .env.production .env

# Validate required environment variables
echo "🔍 Validating production environment..."

required_vars=("SUPABASE_URL" "SUPABASE_SECRET_KEY" "GOOGLE_PLACES_API_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if grep -q "${var}=your_" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf "   - %s\n" "${missing_vars[@]}"
    echo ""
    echo "Please edit .env.production and set these values."
    exit 1
fi

echo "✅ Environment validation passed"

# Start production server
echo "🌐 Starting production server..."
NODE_ENV=production node server.js
EOF

chmod +x start-production.sh
echo "✅ Production startup script created: start-production.sh"
echo ""

# Create iterative testing startup script
echo "📝 Creating iterative testing script..."

cat > run-iterative-testing.sh << 'EOF'
#!/bin/bash

# ProspectPro Iterative Testing Script
# Executes 4-round testing strategy for 25 qualified leads

echo "🧪 ProspectPro Iterative Testing Framework"
echo "========================================"

# Check if server is running
echo "🔍 Checking server status..."
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "❌ ProspectPro server not running. Please start the server first:"
    echo "   ./start-production.sh"
    echo ""
    echo "Or for development:"
    echo "   npm run dev"
    exit 1
fi

echo "✅ Server is running and accessible"
echo ""

# Execute iterative testing framework
echo "🚀 Starting 4-round iterative testing..."
echo "Target: 25 qualified leads across 4 rounds"
echo "Budget: $20 total ($5 per round)"
echo ""

node iterative-testing-framework.js

echo ""
echo "📊 Testing complete! Check generated reports:"
echo "   - round-1-baseline-validation-report.md"
echo "   - round-2-geographic-expansion-report.md" 
echo "   - round-3-industry-vertical-report.md"
echo "   - round-4-quality-optimization-report.md"
echo "   - ProspectPro-V1-Final-Report.md"
EOF

chmod +x run-iterative-testing.sh
echo "✅ Iterative testing script created: run-iterative-testing.sh"
echo ""

# Create development vs production documentation
echo "📝 Creating development vs production guide..."

cat > DEVELOPMENT_VS_PRODUCTION.md << 'EOF'
# Development vs. Production Environment Guide

## Environment Modes

### 🧪 **Algorithm Simulation Mode**
**Files:** `production-simulation.js`, `West-Coast-SMB-Campaign-Results.md`
**Purpose:** Test algorithm logic with synthetic data
**Usage:** `node production-simulation.js`
**Output:** Simulated results for algorithm validation

### 🚀 **Production Testing Mode** 
**Files:** `iterative-testing-framework.js`, `run-production-test.js`
**Purpose:** Execute live API calls with real business data
**Usage:** `./run-iterative-testing.sh` or `node iterative-testing-framework.js`
**Output:** Real business leads with verified contact information

### 🔧 **Development Server Mode**
**Environment:** `NODE_ENV=development`, `SKIP_AUTH_IN_DEV=true`
**Purpose:** Local development and debugging
**Usage:** `npm run dev`
**Features:** Hot reload, auth bypass, detailed error messages

### 🌐 **Production Server Mode**
**Environment:** `NODE_ENV=production`, authentication required
**Purpose:** Live deployment and commercial operations
**Usage:** `./start-production.sh`
**Features:** Full authentication, rate limiting, monitoring

## Configuration Files

### Development
- `.env` - Development environment variables
- `package.json` - Development dependencies and scripts
- Auth bypass enabled for testing

### Production
- `.env.production` - Production environment template
- `start-production.sh` - Production startup script
- Full authentication and security enabled

## Testing Strategies

### Simulation Testing
```bash
# Test algorithm logic with synthetic data
node production-simulation.js
```

### Live API Testing
```bash
# Execute real API calls for business discovery
node iterative-testing-framework.js
```

### Development Testing
```bash
# Start development server with hot reload
npm run dev
```

### Production Deployment
```bash
# Configure production environment
vim .env.production

# Start production server
./start-production.sh
```

## File Naming Conventions

- `*-simulation.js` - Uses synthetic/simulated data
- `*-testing-*.js` - Uses live API calls for real testing  
- `*-development.*` - Development-specific configurations
- `*-production.*` - Production-specific configurations

## Key Differences

| Aspect | Simulation | Development | Production |
|--------|-----------|-------------|------------|
| **Data Source** | Synthetic | Live APIs | Live APIs |
| **Authentication** | None | Bypass Available | Required |
| **Error Handling** | Basic | Detailed | Secure |
| **Rate Limiting** | None | Relaxed | Enforced |
| **Monitoring** | None | Basic | Full |
| **Cost Tracking** | Simulated | Real | Real |
EOF

echo "✅ Environment guide created: DEVELOPMENT_VS_PRODUCTION.md"
echo ""

# Update package.json scripts
echo "📝 Updating package.json scripts..."

# Check if jq is available for JSON editing
if command -v jq > /dev/null; then
    # Use jq to update package.json scripts
    jq '.scripts.prod = "./start-production.sh"' package.json > temp.json && mv temp.json package.json
    jq '.scripts.test = "node production-simulation.js"' package.json > temp.json && mv temp.json package.json
    jq '.scripts["test:live"] = "./run-iterative-testing.sh"' package.json > temp.json && mv temp.json package.json
    echo "✅ Package.json scripts updated"
else
    echo "⚠️  jq not available. Please manually add these scripts to package.json:"
    echo '  "prod": "./start-production.sh",'
    echo '  "test": "node production-simulation.js",'
    echo '  "test:live": "./run-iterative-testing.sh"'
fi

echo ""
echo "🎉 Production Environment Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env.production with your actual API keys"
echo "2. Test the algorithm: npm run test"
echo "3. Start production server: npm run prod" 
echo "4. Run live testing: npm run test:live"
echo ""
echo "📚 See DEVELOPMENT_VS_PRODUCTION.md for detailed usage guide"