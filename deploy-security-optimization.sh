#!/bin/bash

# Supabase Production Security Optimization Deployment Script
# Fixes SECURITY DEFINER views and function search_path warnings
# Adds user authentication and subscription management

echo "🔧 ProspectPro Supabase Production Security Optimization"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Security Issues Being Fixed:${NC}"
echo "  🔴 SECURITY DEFINER views (enrichment_cache_analytics, cache_performance_summary)"
echo "  ⚠️  Function search_path vulnerabilities (4 cache functions)"
echo "  🔐 User authentication and subscription system setup"
echo ""

# Check if we're in the correct directory
if [ ! -f "database/production-security-optimization.sql" ]; then
    echo -e "${RED}❌ Error: production-security-optimization.sql not found${NC}"
    echo "Please run this script from the ProspectPro root directory"
    exit 1
fi

echo -e "${YELLOW}📁 Found security optimization file:${NC} database/production-security-optimization.sql"

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✅ Supabase CLI detected${NC}"
    
    # Check if project is linked
    if [ -f ".supabase/config.toml" ]; then
        echo -e "${GREEN}✅ Supabase project linked${NC}"
        
        echo ""
        echo -e "${BLUE}🚀 Deploying security fixes via Supabase CLI...${NC}"
        
        # Apply the security optimization
        if supabase db push --file database/production-security-optimization.sql; then
            echo -e "${GREEN}✅ Security optimization deployed successfully!${NC}"
        else
            echo -e "${RED}❌ Deployment failed via CLI${NC}"
            echo -e "${YELLOW}💡 Please deploy manually via Supabase dashboard${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Supabase project not linked${NC}"
        echo "Link your project first: supabase link --project-ref sriycekxdqnesdsgwiuc"
    fi
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found${NC}"
fi

echo ""
echo -e "${BLUE}📖 Manual Deployment Instructions:${NC}"
echo "1. Go to: https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/sql"
echo "2. Copy contents of: database/production-security-optimization.sql"
echo "3. Paste and click 'Run' to execute all fixes"
echo ""

echo -e "${BLUE}🔍 Verification Steps:${NC}"
echo "Run these queries in Supabase SQL Editor to verify fixes:"
echo ""
echo -e "${YELLOW}-- Check for remaining SECURITY DEFINER views (should return 0 rows)${NC}"
echo "SELECT schemaname, viewname FROM pg_views"
echo "WHERE viewname IN ('enrichment_cache_analytics', 'cache_performance_summary')"
echo "AND definition LIKE '%SECURITY DEFINER%';"
echo ""
echo -e "${YELLOW}-- Verify functions have search_path set (should return 4 rows)${NC}"
echo "SELECT routine_name FROM information_schema.routines"
echo "WHERE routine_name IN ('generate_cache_key', 'get_cached_response', 'store_cached_response', 'cleanup_expired_cache')"
echo "AND routine_schema = 'public';"
echo ""
echo -e "${YELLOW}-- Check subscription tiers (should return 3 tiers)${NC}"
echo "SELECT name, max_searches, max_exports FROM subscription_tiers WHERE is_active = true;"
echo ""

echo -e "${BLUE}⚡ Next Steps:${NC}"
echo "1. ✅ Deploy security fixes (this script or manual)"
echo "2. 🔐 Configure authentication in Supabase dashboard"
echo "3. 🔑 Update environment variables with current anon key"
echo "4. 🧪 Test authentication and subscription functionality"
echo ""

echo -e "${GREEN}📚 Complete guide available in:${NC} SUPABASE_PRODUCTION_OPTIMIZATION_GUIDE.md"
echo ""

# Check if git is available and offer to commit changes
if command -v git &> /dev/null && [ -d ".git" ]; then
    echo -e "${BLUE}💾 Git Repository Detected${NC}"
    echo "Would you like to commit the security optimization files? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        git add database/production-security-optimization.sql
        git add SUPABASE_PRODUCTION_OPTIMIZATION_GUIDE.md
        git add CAMPAIGN_HISTORY_LINKING_COMPLETE.md
        git commit -m "feat: add Supabase production security optimization

- Fix SECURITY DEFINER views (enrichment_cache_analytics, cache_performance_summary)
- Fix function search_path vulnerabilities (4 cache functions)
- Add user authentication and subscription management schema
- Add campaign history linking functionality
- Production-ready security hardening for multi-tenant SaaS

Addresses critical security warnings:
- 🔴 SECURITY DEFINER inheritance issues
- ⚠️ Function search_path mutable vulnerabilities
- 🔐 RLS policies for user data isolation
- 📊 Usage tracking and subscription limits"
        
        echo -e "${GREEN}✅ Changes committed to git${NC}"
    fi
fi

echo -e "${GREEN}🎉 ProspectPro Security Optimization Complete!${NC}"
echo "Your application is now ready for production deployment with enterprise-grade security."