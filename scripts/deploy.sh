#!/bin/bash

# ProspectPro Smart Deployment Script
# Auto-detects the correct deployment source and deploys to Vercel

echo "🚀 ProspectPro Smart Deploy - v4.2"
echo "📍 Current directory: $(pwd)"

# Function to check if directory exists and has expected files
check_directory() {
    local dir="$1"
    local expected_file="$2"
    
    if [ -d "$dir" ] && [ -f "$dir/$expected_file" ]; then
        return 0
    else
        return 1
    fi
}

# Auto-detect correct deployment source
if check_directory "frontend/dist" "index.html" && [ -f "frontend/package.json" ]; then
    echo "📦 Detected React frontend with build output..."
    echo "📂 Deploying from: frontend/dist/"
    cd frontend/dist && vercel --prod
    
elif check_directory "frontend" "package.json"; then
    echo "📦 Detected React frontend - building first..."
    echo "🔨 Building React app..."
    cd frontend && npm run build
    
    if [ $? -eq 0 ] && [ -d "dist" ]; then
        echo "✅ Build successful - deploying..."
        cd dist && vercel --prod
    else
        echo "❌ Build failed - check frontend build process"
        exit 1
    fi
    
elif check_directory "public" "index.html"; then
    echo "📄 Detected static frontend..."
    echo "📂 Deploying from: public/"
    cd public && vercel --prod
    
else
    echo "❌ No deployable frontend found!"
    echo "Expected one of:"
    echo "  - frontend/dist/index.html (built React app)"
    echo "  - frontend/package.json (React app to build)"
    echo "  - public/index.html (static frontend)"
    exit 1
fi

echo "✅ Deployment completed!"
echo "🔗 Check Vercel dashboard for deployment URL"