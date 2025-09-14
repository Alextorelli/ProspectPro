#!/bin/bash

# ProspectPro Real API Setup Script
# Run this after cloning the repository

echo "🚀 ProspectPro Real API Setup"
echo "============================="

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi

# Create .env file
echo ""
echo "🔧 Setting up environment configuration..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
else
    echo "ℹ️  .env file already exists"
fi

# Run validation tests
echo ""
echo "🧪 Running validation tests..."
npm run test

if [ $? -ne 0 ]; then
    echo "❌ Validation tests failed"
    echo "⚠️  Please check for fake data patterns in the codebase"
    exit 1
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Edit .env with your API keys:"
echo "   - GOOGLE_PLACES_API_KEY (Required)"
echo "   - SCRAPINGDOG_API_KEY (Required)"  
echo "   - HUNTER_IO_API_KEY (Required)"
echo "   - NEVERBOUNCE_API_KEY (Required)"
echo ""
echo "2. Start development server:"
echo "   npm run dev"
echo ""
echo "3. Run tests to verify setup:"
echo "   npm run validate"
echo ""
echo "📚 Documentation: https://github.com/appsmithery/prospect-pro-real-api"
echo ""
echo "🎯 ProspectPro: Zero fake data, real business contacts only!"