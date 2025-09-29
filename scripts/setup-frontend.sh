#!/bin/bash

# ProspectPro Frontend Setup Script
echo "🚀 Setting up ProspectPro Frontend..."

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your actual Supabase keys"
fi

# Check if Supabase project is configured
echo "🔍 Checking Supabase configuration..."
if grep -q "your_supabase_anon_key_here" .env; then
    echo "❌ Please configure your Supabase keys in frontend/.env"
    echo "   You can find them at: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/settings/api"
else
    echo "✅ Environment configuration looks good"
fi

# Start development server
echo "🎯 Frontend setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your Supabase keys in frontend/.env"
echo "2. Run 'npm run dev' in the frontend directory"
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "Your Supabase Edge Functions are deployed at:"
echo "- Enhanced Discovery: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/enhanced-business-discovery"
echo "- Lead Validation: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/lead-validation-edge"
echo "- Business Discovery: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-edge"
echo "- Diagnostics: https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/diag"