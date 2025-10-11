#!/bin/bash
# ProspectPro Zero Results Diagnostic - Quick Test Script
# Run this after completing a campaign to capture diagnostic data

set -e

echo "════════════════════════════════════════════════════════════════"
echo "  ProspectPro Zero Results Diagnostic Data Collector"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Output file
OUTPUT_FILE="diagnostic-results-$(date +%Y%m%d-%H%M%S).txt"

echo -e "${BLUE}📝 This script will help you collect diagnostic data${NC}"
echo -e "${BLUE}   Output will be saved to: ${OUTPUT_FILE}${NC}"
echo ""

# Check if campaign was run
echo -e "${YELLOW}⚠️  PREREQUISITES:${NC}"
echo "   1. Have you opened the app and run a test campaign?"
echo "   2. Did you wait for it to complete?"
echo "   3. Did you navigate to the Results page?"
echo "   4. Do you have the browser DevTools Console open?"
echo ""
read -p "Press ENTER if all prerequisites are met, or Ctrl+C to exit..."

# Initialize output file
{
    echo "═══════════════════════════════════════════════════════════════"
    echo "ProspectPro Zero Results Diagnostic Report"
    echo "Generated: $(date)"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
} > "$OUTPUT_FILE"

# Gather system info
echo -e "${BLUE}📊 Gathering system information...${NC}"
{
    echo "═══════════════════════════════════════════════════════════════"
    echo "SYSTEM INFORMATION"
    echo "═══════════════════════════════════════════════════════════════"
    echo "Date: $(date)"
    echo "Hostname: $(hostname)"
    echo "User: $(whoami)"
    echo ""
} >> "$OUTPUT_FILE"

# Campaign ID
echo ""
echo -e "${GREEN}🎯 Step 1: Campaign Information${NC}"
echo -e "${YELLOW}   Look in browser console for [Results] or [useCampaignResults] logs${NC}"
echo -e "${YELLOW}   Find the campaignId value (looks like: cmp_abc123...)${NC}"
echo ""
read -p "Enter Campaign ID: " CAMPAIGN_ID

{
    echo "═══════════════════════════════════════════════════════════════"
    echo "CAMPAIGN INFORMATION"
    echo "═══════════════════════════════════════════════════════════════"
    echo "Campaign ID: $CAMPAIGN_ID"
    echo ""
} >> "$OUTPUT_FILE"

# Job ID
echo ""
echo -e "${GREEN}📋 Step 2: Job Information${NC}"
echo -e "${YELLOW}   Look in browser console for jobId value${NC}"
echo -e "${YELLOW}   Or check Supabase dashboard → discovery_jobs table${NC}"
echo ""
read -p "Enter Job ID (or press ENTER if unknown): " JOB_ID

{
    echo "Job ID: ${JOB_ID:-UNKNOWN}"
    echo ""
} >> "$OUTPUT_FILE"

# Browser info
echo ""
echo -e "${GREEN}🌐 Step 3: Browser Information${NC}"
read -p "Browser name and version (e.g., Chrome 131): " BROWSER_INFO

{
    echo "Browser: $BROWSER_INFO"
    echo ""
} >> "$OUTPUT_FILE"

# Auth status
echo ""
echo -e "${GREEN}🔐 Step 4: Authentication Status${NC}"
echo "   1) Authenticated (logged in with email/password)"
echo "   2) Anonymous (no account)"
read -p "Select (1 or 2): " AUTH_CHOICE

if [ "$AUTH_CHOICE" = "1" ]; then
    AUTH_STATUS="Authenticated"
else
    AUTH_STATUS="Anonymous"
fi

{
    echo "Auth Status: $AUTH_STATUS"
    echo ""
} >> "$OUTPUT_FILE"

# Console logs
echo ""
echo -e "${GREEN}📜 Step 5: Console Logs${NC}"
echo -e "${YELLOW}   In browser DevTools Console:${NC}"
echo "   1. Right-click in the console"
echo "   2. Select 'Save as...' or copy all content"
echo "   3. Save to a file or prepare to paste"
echo ""
read -p "Press ENTER when you have console logs ready..."

echo ""
echo -e "${BLUE}Paste console logs below.${NC}"
echo -e "${BLUE}When done, type 'END_LOGS' on a new line and press ENTER:${NC}"
echo ""

{
    echo "═══════════════════════════════════════════════════════════════"
    echo "CONSOLE LOGS"
    echo "═══════════════════════════════════════════════════════════════"
} >> "$OUTPUT_FILE"

while IFS= read -r line; do
    if [ "$line" = "END_LOGS" ]; then
        break
    fi
    echo "$line" >> "$OUTPUT_FILE"
done

echo "" >> "$OUTPUT_FILE"

# Network responses
echo ""
echo -e "${GREEN}🌐 Step 6: Network Responses${NC}"
echo -e "${YELLOW}   In browser DevTools Network tab:${NC}"
echo "   1. Filter for 'campaigns'"
echo "   2. Find GET request to /rest/v1/campaigns"
echo "   3. Click on it → Response tab"
echo "   4. Copy the JSON response"
echo ""
read -p "Press ENTER when ready to paste campaigns response..."

echo ""
echo -e "${BLUE}Paste campaigns response below.${NC}"
echo -e "${BLUE}When done, type 'END_NETWORK' on a new line and press ENTER:${NC}"
echo ""

{
    echo "═══════════════════════════════════════════════════════════════"
    echo "NETWORK RESPONSE: Campaigns"
    echo "═══════════════════════════════════════════════════════════════"
} >> "$OUTPUT_FILE"

while IFS= read -r line; do
    if [ "$line" = "END_NETWORK" ]; then
        break
    fi
    echo "$line" >> "$OUTPUT_FILE"
done

echo "" >> "$OUTPUT_FILE"

# Leads network response
echo ""
echo -e "${BLUE}Now for leads response:${NC}"
echo "   1. Filter for 'leads'"
echo "   2. Find GET request to /rest/v1/leads"
echo "   3. Copy the JSON response"
echo ""
read -p "Press ENTER when ready to paste leads response..."

echo ""
echo -e "${BLUE}Paste leads response below.${NC}"
echo -e "${BLUE}When done, type 'END_NETWORK' on a new line and press ENTER:${NC}"
echo ""

{
    echo "═══════════════════════════════════════════════════════════════"
    echo "NETWORK RESPONSE: Leads"
    echo "═══════════════════════════════════════════════════════════════"
} >> "$OUTPUT_FILE"

while IFS= read -r line; do
    if [ "$line" = "END_NETWORK" ]; then
        break
    fi
    echo "$line" >> "$OUTPUT_FILE"
done

echo "" >> "$OUTPUT_FILE"

# SQL queries
echo ""
echo -e "${GREEN}🗄️  Step 7: Database Queries${NC}"
echo -e "${YELLOW}   Open Supabase Dashboard → SQL Editor${NC}"
echo -e "${YELLOW}   Run queries from /scripts/debug-campaign.sql${NC}"
echo ""
echo "Query 1: Campaign + Job Details"
read -p "Press ENTER when ready to paste results..."

echo ""
echo -e "${BLUE}Paste Query 1 results below.${NC}"
echo -e "${BLUE}When done, type 'END_SQL' on a new line and press ENTER:${NC}"
echo ""

{
    echo "═══════════════════════════════════════════════════════════════"
    echo "SQL QUERY 1: Campaign + Job Details"
    echo "═══════════════════════════════════════════════════════════════"
} >> "$OUTPUT_FILE"

while IFS= read -r line; do
    if [ "$line" = "END_SQL" ]; then
        break
    fi
    echo "$line" >> "$OUTPUT_FILE"
done

echo "" >> "$OUTPUT_FILE"

# Query 2
echo ""
echo "Query 2: Actual Leads in Database"
read -p "Press ENTER when ready to paste results..."

echo ""
echo -e "${BLUE}Paste Query 2 results below.${NC}"
echo -e "${BLUE}When done, type 'END_SQL' on a new line and press ENTER:${NC}"
echo ""

{
    echo "═══════════════════════════════════════════════════════════════"
    echo "SQL QUERY 2: Actual Leads"
    echo "═══════════════════════════════════════════════════════════════"
} >> "$OUTPUT_FILE"

while IFS= read -r line; do
    if [ "$line" = "END_SQL" ]; then
        break
    fi
    echo "$line" >> "$OUTPUT_FILE"
done

echo "" >> "$OUTPUT_FILE"

# Observations
echo ""
echo -e "${GREEN}📝 Step 8: Your Observations${NC}"
echo -e "${BLUE}Any patterns or issues you noticed?${NC}"
echo -e "${BLUE}Type your observations and end with 'END_OBSERVATIONS':${NC}"
echo ""

{
    echo "═══════════════════════════════════════════════════════════════"
    echo "USER OBSERVATIONS"
    echo "═══════════════════════════════════════════════════════════════"
} >> "$OUTPUT_FILE"

while IFS= read -r line; do
    if [ "$line" = "END_OBSERVATIONS" ]; then
        break
    fi
    echo "$line" >> "$OUTPUT_FILE"
done

echo "" >> "$OUTPUT_FILE"

# Completion
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Diagnostic data collection complete!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}📄 Results saved to:${NC} $OUTPUT_FILE"
echo ""
echo -e "${YELLOW}📤 Next steps:${NC}"
echo "   1. Review the output file: cat $OUTPUT_FILE"
echo "   2. Create a GitHub Gist with the contents"
echo "   3. Share the Gist URL in chat"
echo ""
echo -e "${BLUE}Or paste the file contents directly in chat:${NC}"
echo "   cat $OUTPUT_FILE"
echo ""
echo "═══════════════════════════════════════════════════════════════"
