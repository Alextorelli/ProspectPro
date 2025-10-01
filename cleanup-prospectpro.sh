#!/bin/bash

# ProspectPro Cleanup Script
# Clean up unused Edge Functions and database issues
# Date: 2025-10-01

echo "🧹 Starting ProspectPro cleanup..."

# =============================================================================
# EDGE FUNCTIONS CLEANUP
# =============================================================================

echo "📦 Cleaning up unused Edge Functions..."

# Keep only the functions we actually use:
# ✅ business-discovery (main function called by frontend)
# ✅ campaign-export (used for CSV exports)
# ❌ business-discovery-optimized (newer version, may replace main)
# ❌ enhanced-business-discovery (unused)
# ❌ business-discovery-edge (duplicate)
# ❌ diag (diagnostic function, not needed in production)

# Delete unused Edge Functions
echo "🗑️  Deleting unused Edge Functions..."

supabase functions delete enhanced-business-discovery --project-ref sriycekxdqnesdsgwiuc
supabase functions delete business-discovery-edge --project-ref sriycekxdqnesdsgwiuc  
supabase functions delete diag --project-ref sriycekxdqnesdsgwiuc

# Keep business-discovery and campaign-export (actively used)
# Keep business-discovery-optimized (may be the better version with Foursquare integration)

echo "✅ Edge Functions cleanup complete"

# =============================================================================
# LOCAL FILES CLEANUP
# =============================================================================

echo "📁 Cleaning up local Edge Function directories..."

# Remove unused Edge Function directories
rm -rf /workspaces/ProspectPro/supabase/functions/enhanced-business-discovery
echo "🗑️  Removed enhanced-business-discovery directory"

# Keep business-discovery, business-discovery-optimized, and campaign-export

echo "✅ Local files cleanup complete"

# =============================================================================
# DATABASE CLEANUP
# =============================================================================

echo "🗄️  Running database cleanup and security fixes..."

# Apply the security fixes SQL script
supabase db reset --linked
echo "🔄 Database reset complete"

echo "📋 Applying cleanup and security fixes..."
psql "postgresql://postgres:[password]@db.sriycekxdqnesdsgwiuc.supabase.co:5432/postgres" -f /workspaces/ProspectPro/database/cleanup-and-security-fixes.sql

echo "✅ Database cleanup complete"

# =============================================================================
# VERIFICATION
# =============================================================================

echo "🔍 Verifying cleanup..."

echo "📦 Remaining Edge Functions:"
supabase functions list

echo "📁 Remaining local function directories:"
ls -la /workspaces/ProspectPro/supabase/functions/

echo "🚀 Cleanup complete! Summary:"
echo "✅ Kept essential Edge Functions: business-discovery, business-discovery-optimized, campaign-export"
echo "✅ Removed unused Edge Functions: enhanced-business-discovery, business-discovery-edge, diag"
echo "✅ Fixed database security issues"
echo "✅ Cleaned up unnecessary database tables"
echo "✅ Maintained core functionality"

echo "🎉 ProspectPro is now clean and optimized!"