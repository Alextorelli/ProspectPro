#!/bin/bash

# ProspectPro - Iterative Testing Branch v1 - Verification Script
# This script validates the testing environment is properly configured

echo "🧪 ProspectPro - Iterative Testing Branch v1 Verification"
echo "========================================================="
echo ""

# Check branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📋 Current Branch: $CURRENT_BRANCH"
if [ "$CURRENT_BRANCH" != "iterative-testing-v1" ]; then
    echo "⚠️  Warning: Expected branch 'iterative-testing-v1' but on '$CURRENT_BRANCH'"
else
    echo "✅ Correct testing branch"
fi
echo ""

# Check Node.js version
echo "🔧 Node.js Environment:"
node --version
npm --version
echo ""

# Check if .env exists
echo "🔐 Environment Configuration:"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    # Check for required API keys (without revealing values)
    API_KEYS=("GOOGLE_PLACES_API_KEY" "FOURSQUARE_API_KEY" "HUNTER_IO_API_KEY" "NEVERBOUNCE_API_KEY" "SUPABASE_URL" "SUPABASE_SECRET_KEY")
    
    for key in "${API_KEYS[@]}"; do
        if grep -q "^${key}=" .env && ! grep -q "^${key}=your_" .env; then
            echo "✅ $key: Configured"
        else
            echo "❌ $key: Not configured (still has placeholder)"
        fi
    done
else
    echo "❌ .env file missing"
    echo "   Run: cp .env.example .env"
    echo "   Then configure your API keys"
fi
echo ""

# Check dependencies
echo "📦 Dependencies:"
if [ -d "node_modules" ]; then
    echo "✅ node_modules installed"
else
    echo "❌ Dependencies not installed"
    echo "   Run: npm install"
fi
echo ""

# Check critical files exist
echo "📁 Critical Files Check:"
FILES=(
    "server.js"
    "api/business-discovery.js"
    "modules/enhanced-lead-discovery.js"
    "modules/api-clients/google-places.js"
    "modules/api-clients/foursquare-places-client.js"
    "test/verify-no-fake-data.js"
    "test/test-production-api-real-data.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
    fi
done
echo ""

# Run fake data verification
echo "🔍 Fake Data Verification:"
if command -v node >/dev/null 2>&1; then
    if [ -f "test/verify-no-fake-data.js" ]; then
        echo "Running fake data scan..."
        if node test/verify-no-fake-data.js > /tmp/fake_data_check.log 2>&1; then
            echo "✅ No fake data patterns found"
        else
            echo "❌ Fake data verification failed"
            echo "Check log: cat /tmp/fake_data_check.log"
        fi
    else
        echo "❌ Verification script missing"
    fi
else
    echo "❌ Node.js not available"
fi
echo ""

# Test API structure
echo "🏗️  API Structure Test:"
if [ -f "test/test-production-api-real-data.js" ]; then
    echo "Running API structure verification..."
    if node test/test-production-api-real-data.js > /tmp/api_structure_check.log 2>&1; then
        echo "✅ API structure validation passed"
    else
        echo "❌ API structure validation failed"
        echo "Check log: cat /tmp/api_structure_check.log"
    fi
else
    echo "❌ API structure test missing"
fi
echo ""

# Check server can start
echo "🚀 Server Health Check:"
if command -v node >/dev/null 2>&1 && [ -f "server.js" ]; then
    echo "Testing server startup (5 second timeout)..."
    
    # Start server in background
    timeout 5s node server.js > /tmp/server_test.log 2>&1 &
    SERVER_PID=$!
    
    # Wait a moment for server to start
    sleep 2
    
    # Test health endpoint
    if command -v curl >/dev/null 2>&1; then
        if curl -s http://localhost:3000/health >/dev/null 2>&1; then
            echo "✅ Server starts successfully"
            echo "✅ Health endpoint responds"
        else
            echo "⚠️  Server started but health endpoint not responding"
            echo "   This may be normal if API keys aren't configured"
        fi
    else
        echo "⚠️  curl not available, cannot test health endpoint"
    fi
    
    # Clean up
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
else
    echo "❌ Cannot test server (missing node or server.js)"
fi
echo ""

# Summary
echo "📊 TESTING BRANCH VERIFICATION SUMMARY:"
echo "======================================="

# Count checks
TOTAL_CHECKS=0
PASSED_CHECKS=0

# This is a simplified summary - in practice you'd track each check
if [ "$CURRENT_BRANCH" = "iterative-testing-v1" ]; then
    echo "✅ Branch configuration correct"
    ((PASSED_CHECKS++))
else
    echo "❌ Branch configuration incorrect"
fi
((TOTAL_CHECKS++))

if [ -f ".env" ]; then
    echo "✅ Environment file exists"
    ((PASSED_CHECKS++))
else
    echo "❌ Environment file missing"
fi
((TOTAL_CHECKS++))

if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
    ((PASSED_CHECKS++))
else
    echo "❌ Dependencies missing"
fi
((TOTAL_CHECKS++))

if [ -f "test/verify-no-fake-data.js" ]; then
    echo "✅ Fake data verification available"
    ((PASSED_CHECKS++))
else
    echo "❌ Fake data verification missing"
fi
((TOTAL_CHECKS++))

echo ""
echo "🎯 Score: $PASSED_CHECKS/$TOTAL_CHECKS checks passed"

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    echo "🎉 TESTING BRANCH READY FOR REAL API TESTING!"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Configure API keys in .env file"
    echo "2. Start server: npm run dev"
    echo "3. Test real API: POST to /api/business-discovery"
    echo "4. Monitor costs in dashboard"
else
    echo "⚠️  TESTING BRANCH NEEDS CONFIGURATION"
    echo ""
    echo "🔧 Required actions:"
    if [ "$CURRENT_BRANCH" != "iterative-testing-v1" ]; then
        echo "- Switch to correct branch: git checkout iterative-testing-v1"
    fi
    if [ ! -f ".env" ]; then
        echo "- Create environment file: cp .env.example .env"
    fi
    if [ ! -d "node_modules" ]; then
        echo "- Install dependencies: npm install"
    fi
    echo "- Configure real API keys in .env"
fi

echo ""
echo "📚 Documentation: See TESTING_BRANCH_README.md for detailed setup"
echo "🔍 Logs: Check /tmp/*.log files if tests failed"