# Railway Deployment Guide - Supabase Connection Configuration

## Recommended Supabase Connection Method

For Railway deployment, use **Transaction Pooler** (port 6543) for optimal performance with stateless applications:

```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Why Transaction Pooler for Railway?

1. **Stateless Apps**: Railway containers can restart frequently - transaction pooler handles this efficiently
2. **Connection Efficiency**: Automatic connection pooling prevents "too many connections" errors  
3. **Scale Ready**: Supports multiple Railway replicas without connection limits
4. **Cost Effective**: Reduces connection overhead and database resource usage

## Railway Environment Variables Setup

In your Railway project dashboard, set these environment variables:

### Required Database Configuration
```bash
SUPABASE_URL=postgresql://postgres.[your-ref]:[your-password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your_actual_secret_key_here
SUPABASE_ANON_KEY=your_anon_key_here
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

### 1. Direct Connection (if Transaction Pooler fails)
```
postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

### 2. Session Pooler (IPv4 compatible)
```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### 3. HTTP REST API (legacy compatibility)
```
https://[your-project-id].supabase.co
```

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
   # Use Transaction Pooler URL format
   SUPABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
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

### Issue: "Connection refused" or timeout errors
**Solution**: Switch to Direct Connection method (port 5432)

### Issue: "too many connections" error  
**Solution**: Ensure you're using Transaction Pooler (port 6543), not Direct Connection

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