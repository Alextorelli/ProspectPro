# Railway Deployment Guide - Supabase Connection Configuration

## Recommended Supabase Connection Method

IMPORTANT: `SUPABASE_URL` MUST remain the HTTPS API base: `https://<project-ref>.supabase.co`.
Do NOT set the Postgres connection string as `SUPABASE_URL` – the Supabase JS client requires the HTTP base.

For direct Postgres connectivity (raw SQL, migrations, analytics jobs) define a separate variable:

```
SUPABASE_DB_POOLER_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

### Why Transaction Pooler for Railway?

1. **Stateless Apps**: Railway containers can restart frequently - transaction pooler handles this efficiently
2. **Connection Efficiency**: Automatic connection pooling prevents "too many connections" errors  
3. **Scale Ready**: Supports multiple Railway replicas without connection limits
4. **Cost Effective**: Reduces connection overhead and database resource usage

## Railway Environment Variables Setup

In your Railway project dashboard, set these environment variables:

### Required Database/API Configuration
```bash
# Required for supabase-js client
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_actual_secret_key_here
SUPABASE_ANON_KEY=your_anon_key_here

# Optional: For raw Postgres access (DO NOT use for supabase-js)
SUPABASE_DB_POOLER_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
# Optional additional fallbacks:
# SUPABASE_DB_DIRECT_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
# SUPABASE_DB_SESSION_POOLER_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

### API Keys (Required for Real Data)
```bash
GOOGLE_PLACES_API_KEY=your_google_places_key
HUNTER_IO_API_KEY=your_hunter_io_key  
NEVERBOUNCE_API_KEY=your_neverbounce_key
SCRAPINGDOG_API_KEY=your_scrapingdog_key
```

### Security & Authentication
```bash
PERSONAL_ACCESS_TOKEN=your_secure_32_char_token
ADMIN_PASSWORD=your_admin_dashboard_password
NODE_ENV=production
```

## Alternative Connection Methods (Fallbacks)

### Connection Reference (when to use)

| Purpose | Variable | Example | Notes |
|---------|----------|---------|-------|
| Supabase JS client (Auth, Storage, REST, Realtime) | SUPABASE_URL | https://<ref>.supabase.co | REQUIRED |
| Transaction Pooler (stateless API workers) | SUPABASE_DB_POOLER_URL | postgresql://postgres.<ref>:pwd@aws-0-<region>.pooler.supabase.com:6543/postgres | Recommended |
| Direct Connection (debug / heavy migrations) | SUPABASE_DB_DIRECT_URL | postgresql://postgres:pwd@db.<ref>.supabase.co:5432/postgres | Fallback |
| Session Pooler (IPv4 fallback) | SUPABASE_DB_SESSION_POOLER_URL | postgresql://postgres.<ref>:pwd@aws-0-<region>.pooler.supabase.com:5432/postgres | Use only if required |

## Getting Your Supabase Connection Details

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **Database**
4. In the "Connection parameters" section:
   - Copy the **Transaction pooler** connection string
   - Replace `[YOUR-PASSWORD]` with your actual database password
   - Use this as your `SUPABASE_URL`

## Deployment Steps

1. **Update Railway Environment Variables** (project dashboard → Variables):
   ```bash
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_...
   SUPABASE_ANON_KEY=sb_anon_...
   SUPABASE_DB_POOLER_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
   ```

2. **Deploy to Railway**:
   ```bash
   git push origin main
   ```

3. **Verify Connection**:
   - Check Railway logs for successful Supabase connection
   - Test `/health` endpoint: `https://your-app.railway.app/health`
   - Expected response: `{"status":"healthy","database":"connected"}`

## Troubleshooting Connection Issues

### Issue: "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL"
**Cause**: You set a `postgresql://` value in `SUPABASE_URL`.
**Fix**: Move that value to `SUPABASE_DB_POOLER_URL` and set `SUPABASE_URL=https://<ref>.supabase.co`.

### Issue: "Connection refused" or timeout errors on pooler
**Solution**: Try `SUPABASE_DB_DIRECT_URL` temporarily to isolate network issues.

### Issue: "too many connections"
**Solution**: Ensure workers use pooler (`SUPABASE_DB_POOLER_URL`), not direct.

### Issue: IPv6 connectivity problems
**Solution**: Use Session Pooler which is IPv4 compatible

### Issue: SSL/TLS certificate errors
**Solution**: Add `?sslmode=require` to your connection string

## Monitoring & Health Checks

Railway will automatically:
- Health check your app every 90 seconds via `/health`
- Restart on failure (max 3 retries)
- Show connection status in deployment logs

## Cost Optimization

Transaction Pooler helps reduce costs by:
- Efficient connection reuse
- Lower database resource consumption  
- Reduced connection establishment overhead
- Better performance under load

## Security Notes

- Never commit actual credentials to git
- Use Railway's encrypted environment variables
- Rotate API keys regularly
- Monitor database connection logs for suspicious activity

## Support

If you encounter connection issues:
1. Check Railway deployment logs
2. Verify Supabase database is active
3. Test connection string locally first  
4. Switch to fallback connection method if needed