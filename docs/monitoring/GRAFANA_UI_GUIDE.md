# Grafana Connection Guide - Multiple UI Versions

## Finding Your Grafana UI Version

Your Grafana Cloud interface might look different depending on the version. Here are the common configurations:

## Method 1: Basic Configuration (Most Common)

Look for these fields in your PostgreSQL data source setup:

```yaml
# Basic Connection
Host: db.vvxdprgfltzblwvpedpx.supabase.co:5432
Database: postgres
Username: postgres
Password: aqDw8YTgQQK2bxgy

# SSL Settings (try one of these)
SSL Mode: require
SSL Mode: disable
SSL Mode: prefer
```

## Method 2: Advanced/Connection String Format

If you see a "Connection String" or "URL" field:

```
postgres://postgres:aqDw8YTgQQK2bxgy@db.vvxdprgfltzblwvpedpx.supabase.co:5432/postgres?sslmode=require
```

## Method 3: Separate Host/Port Fields

If host and port are separate:

```yaml
Host: db.vvxdprgfltzblwvpedpx.supabase.co
Port: 5432
Database: postgres
Username: postgres
Password: aqDw8YTgQQK2bxgy
```

## Method 4: IPv4 Force (Network Fix)

If getting "network unreachable" errors:

```yaml
# Use IPv4 directly (resolve DNS first)
Host: 54.90.150.25:5432
Database: postgres  
Username: postgres
Password: aqDw8YTgQQK2bxgy
SSL Mode: disable
```

## Alternative Supabase Connection Methods

### Direct API Connection (Backup)

If database connection fails, you can use Supabase REST API:

1. **Data Source Type**: JSON API or HTTP
2. **URL**: `https://vvxdprgfltzblwvpedpx.supabase.co/rest/v1/`
3. **Headers**:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGRwcmdmbHR6Ymx3dnBlZHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MTgzOTksImV4cCI6MjA0MDI5NDM5OX0.TZ9kR6FfNvnZMJF9P6NX6rYSVfM3LRw7BfGK7U6YXwc
   apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGRwcmdmbHR6Ymx3dnBlZHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MTgzOTksImV4cCI6MjA0MDI5NDM5OX0.TZ9kR6FfNvnZMJF9P6NX6rYSVfM3LRw7BfGK7U6YXwc
   Content-Type: application/json
   ```

## Troubleshooting Steps

### Step 1: Test Different SSL Modes

Try these SSL settings in order:
1. `SSL Mode: disable` (simplest)
2. `SSL Mode: prefer`
3. `SSL Mode: require`

### Step 2: Test Network Connectivity

If still failing, the issue might be:
- Grafana Cloud → Supabase network routing
- IPv6/IPv4 connectivity issues
- Firewall restrictions

### Step 3: Alternative Connection Test

Create a simple HTTP endpoint test:

```bash
# Test if Supabase is reachable
curl -I https://vvxdprgfltzblwvpedpx.supabase.co/rest/v1/campaigns
```

## Common Grafana UI Patterns

### Pattern A: Tabbed Interface
- Connection Tab: Host, Database, Username, Password
- SSL Tab: SSL Mode, Certificates
- Advanced Tab: Timeouts, Pool settings

### Pattern B: Single Form
- All settings on one page
- SSL settings in collapsible section

### Pattern C: Connection String
- Single URL/Connection String field
- Advanced settings in separate section

## What to Try Right Now

1. **Use IPv4 directly**: `54.90.150.25:5432`
2. **Set SSL to**: `disable` 
3. **Test connection**
4. **If successful**, gradually add SSL back

Let me know which UI pattern matches yours and what fields you see!