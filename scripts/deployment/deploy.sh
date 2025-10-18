#!/bin/bash

# ProspectPro Smart Deployment Script
# Auto-detects the correct deployment source and deploys to Vercel

require_repo_root() {
    local expected_root="${EXPECTED_REPO_ROOT:-/workspaces/ProspectPro}"
    local repo_root

    if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
        echo "❌ Unable to determine git root. Run this script from inside the ProspectPro repository." >&2
        exit 1
    fi

    local current_dir
    current_dir=$(pwd -P)
    if [ "$current_dir" != "$repo_root" ]; then
        echo "❌ Run this script from the repository root ($repo_root). Current directory: $current_dir" >&2
        exit 1
    fi

    if [ "$repo_root" != "$expected_root" ]; then
        echo "❌ Repository root mismatch. Expected $expected_root but detected $repo_root." >&2
        echo "   Set EXPECTED_REPO_ROOT to override when deploying from a different checkout." >&2
        exit 1
    fi
}

require_repo_root

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
if check_directory "dist" "index.html" && [ -f "package.json" ] && grep -q "vite" package.json; then
    echo "📦 Detected built React/Vite app..."
    echo "📂 Deploying from: dist/"
    cd dist && vercel --prod
    
elif [ -f "package.json" ] && grep -q "vite" package.json; then
    echo "📦 Detected React/Vite app - building first..."
    echo "🔨 Building React app..."
    npm run build
    
    if [ $? -eq 0 ] && [ -d "dist" ]; then
        echo "✅ Build successful - deploying..."
        cd dist && vercel --prod
    else
        echo "❌ Build failed - check build process"
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