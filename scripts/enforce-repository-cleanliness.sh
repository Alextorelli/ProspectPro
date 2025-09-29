#!/bin/bash

# ProspectPro Repository Cleanliness Enforcer
# Prevents and cleans up root directory clutter

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🧹 ProspectPro Repository Cleanliness Enforcer"
echo "=============================================="

# Function to check and move files
cleanup_root_clutter() {
    local moved_files=0
    
    echo "🔍 Scanning for files that don't belong in root..."
    
    # Test/Analysis/Debug files → scripts/
    for file in test-*.js *-test.js *-analysis.js *-fix.js *-troubleshooting.js \
                debug-*.js *-debug.js validate-*.js verify-*.js \
                *-monitoring.js *-status.js *-validation.js; do
        if [ -f "$file" ]; then
            echo "  📁 Moving $file → scripts/"
            mv "$file" scripts/
            ((moved_files++))
        fi
    done
    
    # Deployment files → archive/deployment-troubleshooting/
    for file in deployment-*.js cloud-*.js trigger-*.js \
                *-deployment-*.js artifact-registry-*.js \
                github-secrets-*.js manual-trigger-*.js; do
        if [ -f "$file" ]; then
            mkdir -p archive/deployment-troubleshooting
            echo "  📁 Moving $file → archive/deployment-troubleshooting/"
            mv "$file" archive/deployment-troubleshooting/
            ((moved_files++))
        fi
    done
    
    # Status/Report files → docs/ or scripts/
    for file in *-status-report.js *-initialization-*.js production-*-status.js; do
        if [ -f "$file" ]; then
            echo "  📁 Moving $file → scripts/"
            mv "$file" scripts/
            ((moved_files++))
        fi
    done
    
    # Documentation files → docs/
    for file in DEPLOYMENT_STATUS_*.md *-STATUS-*.md; do
        if [ -f "$file" ]; then
            echo "  📁 Moving $file → docs/"
            mv "$file" docs/
            ((moved_files++))
        fi
    done
    
    # Log files → logs/
    for file in *.log startup.log production*.log server-test.log; do
        if [ -f "$file" ]; then
            echo "  📁 Moving $file → logs/"
            mv "$file" logs/
            ((moved_files++))
        fi
    done
    
    # Temporary files → delete
    for file in *.tmp *.temp diagnostics.json build-*.json; do
        if [ -f "$file" ]; then
            echo "  🗑️  Removing temporary file: $file"
            rm "$file"
            ((moved_files++))
        fi
    done
    
    return $moved_files
}

# Function to validate root directory
validate_root_structure() {
    echo "✅ Validating root directory structure..."
    
    # Allowed files in root
    ALLOWED_ROOT_FILES=(
        "server.js"
        "package.json"
        "package-lock.json"
        "Dockerfile"
        "docker-compose.yml"
        "docker-compose.dev.yml"
        "cloudbuild.yaml"
        "app.json"
        "README.md"
        "CHANGELOG.md"
        "LICENSE"
        ".env"
        ".env.example"
        ".env.docker"
        ".gitignore"
        ".dockerignore"
        ".gitmessage"
        ".nixpacks.toml"
        ".nvmrc"
        ".codespaces-init.sh"
    )
    
    # Check for unauthorized files
    local violations=0
    for file in *.js *.md *.json *.log *.tmp; do
        if [ -f "$file" ]; then
            local allowed=false
            for allowed_file in "${ALLOWED_ROOT_FILES[@]}"; do
                if [ "$file" = "$allowed_file" ]; then
                    allowed=true
                    break
                fi
            done
            
            if [ "$allowed" = false ]; then
                echo "❌ VIOLATION: $file should not be in root directory"
                ((violations++))
            fi
        fi
    done
    
    if [ $violations -eq 0 ]; then
        echo "✅ Root directory structure is clean"
        return 0
    else
        echo "⚠️  Found $violations file(s) that need to be moved"
        return $violations
    fi
}

# Function to update git status
update_git_status() {
    if [ -n "$(git status --porcelain)" ]; then
        echo "📝 Staging cleanup changes..."
        git add -A
        git status --short
        
        read -p "📤 Commit cleanup changes? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git commit -m "🧹 AUTOMATED: Repository cleanup - moved $(date '+%Y-%m-%d %H:%M')"
            echo "✅ Changes committed"
        else
            echo "⏸️  Changes staged but not committed"
        fi
    else
        echo "✅ No changes to commit"
    fi
}

# Main execution
echo "📊 Current root directory status:"
ls -la *.js *.md *.log *.tmp 2>/dev/null | head -10 || echo "  (no problematic files found)"

echo ""
if cleanup_root_clutter; then
    moved_count=$?
    if [ $moved_count -gt 0 ]; then
        echo "✅ Moved $moved_count files to proper locations"
    else
        echo "✅ No files needed to be moved"
    fi
else
    echo "⚠️  Some cleanup actions were performed"
fi

echo ""
validate_root_structure

echo ""
update_git_status

echo ""
echo "🎯 REPOSITORY CLEANLINESS RULES:"
echo "  ✅ Scripts → scripts/ folder"
echo "  ✅ Documentation → docs/ folder" 
echo "  ✅ Archives → archive/ folder"
echo "  ✅ Logs → logs/ folder"
echo "  ❌ NO troubleshooting/analysis files in root"
echo "  ❌ NO temporary files in root"
echo ""
echo "🚀 Repository is now clean and production-ready!"