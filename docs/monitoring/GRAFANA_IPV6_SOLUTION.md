# Grafana IPv6 Connection Issue - Complete Solution Guide

## Problem Diagnosis
- **Error**: `dial tcp [2600:1f16:1cd0:3318:a9d4:3841:2712:cf98]:5432: connect: network is unreachable`
- **Root Cause**: Supabase host only provides IPv6 address, Grafana Cloud network cannot reach it
- **Host**: `db.vvxdprgfltzblwvpedpx.supabase.co:5432` → resolves to IPv6 only

## Solution 1: Private Data Source Connect (PDC) - RECOMMENDED

### What is PDC?
Private Data Source Connect creates a secure tunnel between Grafana Cloud and your private network resources, bypassing network connectivity issues.

### Setup Steps:
1. **In your Grafana data source page**: 
   - Scroll to "Private data source connect" section at bottom
   - Click the dropdown (currently shows "Choose")
   - Select "Create new PDC connection" or choose existing one

2. **If creating new PDC**:
   - Follow Grafana's PDC setup wizard
   - Install PDC agent in your network (or use cloud proxy)
   - Configure network routing to reach Supabase

3. **Benefits**:
   - Bypasses IPv6/IPv4 network issues  
   - Secure encrypted tunnel
   - Handles all network routing automatically

### Cost Note:
PDC may have additional costs in Grafana Cloud. Check your plan details.

## Solution 2: Connection String Format

### Try This Format:
Instead of separate Host/Database fields, try entering in **Host URL** field:
```
postgresql://postgres:aqDw8YTgQQK2bxgy@db.vvxdprgfltzblwvpedpx.supabase.co:5432/postgres?sslmode=disable
```

### Settings:
- **Host URL**: (connection string above)
- **Database name**: Leave blank or "postgres"  
- **Username**: Leave blank (included in string)
- **Password**: Leave blank (included in string)
- **TLS/SSL Mode**: disable

## Solution 3: Supabase REST API Alternative

### If PostgreSQL connection continues to fail:

1. **Change Data Source Type**:
   - Delete current PostgreSQL data source
   - Add new data source → **JSON API** (or HTTP)

2. **Configuration**:
   ```yaml
   URL: https://vvxdprgfltzblwvpedpx.supabase.co/rest/v1
   
   Headers:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGRwcmdmbHR6Ymx3dnBlZHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MTgzOTksImV4cCI6MjA0MDI5NDM5OX0.TZ9kR6FfNvnZMJF9P6NX6rYSVfM3LRw7BfGK7U6YXwc
   apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGRwcmdmbHR6Ymx3dnBlZHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MTgzOTksImV4cCI6MjA0MDI5NDM5OX0.TZ9kR6FfNvnZMJF9P6NX6rYSVfM3LRw7BfGK7U6YXwc
   Content-Type: application/json
   ```

3. **Test Connection**:
   ```
   GET /api_cost_tracking?select=*&limit=1
   ```

## Solution 4: Alternative Supabase Endpoints

### Check if Supabase provides IPv4 endpoints:

1. **Try Different Supabase URLs**:
   - `aws-0-us-east-1.pooler.supabase.com` (pooler connection)
   - Direct IP if available

2. **Check Supabase Dashboard**:
   - Login to Supabase
   - Settings → Database → Connection Info
   - Look for alternative connection strings

## Recommended Action Plan

### **Priority 1: Try Connection String (5 min)**
Use Solution 2 - copy exact connection string into Host URL field

### **Priority 2: Set up PDC (15-30 min)** 
If connection string fails, implement Solution 1 for permanent fix

### **Priority 3: REST API Fallback (10 min)**
If PostgreSQL is impossible, use Solution 3 for HTTP-based monitoring

## Testing Each Solution

### **Test 1: Connection String**
```
Host URL: postgresql://postgres:aqDw8YTgQQK2bxgy@db.vvxdprgfltzblwvpedpx.supabase.co:5432/postgres?sslmode=disable
Click "Save & Test"
Expected: Success or different error message
```

### **Test 2: PDC** 
```
Private data source connect: [Select/Create PDC]
Host URL: db.vvxdprgfltzblwvpedpx.supabase.co:5432  
Database: postgres
Username: postgres
Password: aqDw8YTgQQK2bxgy
SSL: disable
Expected: Connection through secure tunnel
```

### **Test 3: REST API**
```
Data Source: JSON API
URL: https://vvxdprgfltzblwvpedpx.supabase.co/rest/v1/api_cost_tracking?select=*&limit=1&apikey=...
Expected: JSON response with monitoring data
```

## Next Steps

**Try Solution 2 first** (connection string format) - it's the quickest test.
**Report back with results** and I'll guide you through the successful solution or move to PDC setup.