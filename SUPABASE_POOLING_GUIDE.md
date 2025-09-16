# Supabase Connection Pooling Quick Reference

## 🚀 Optimal Configuration for Railway

### Environment Variables to Set in Railway Dashboard

```env
# Core Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your_key_here

# Connection Pooling (RECOMMENDED for Railway)
SUPABASE_POOL_MODE=transaction
SUPABASE_DATABASE_URL_TRANSACTION=postgresql://postgres:[your_password]@db.sriycekxdqnesdsgwiuc.supabase.co:6543/postgres
SUPABASE_DATABASE_URL_SESSION=postgresql://postgres:[your_password]@db.sriycekxdqnesdsgwiuc.supabase.co:5432/postgres

# Standard Railway Settings
NODE_ENV=production
PORT=8080
```

### Connection Strategies Explained

| Strategy | Port | Best For | Railway Compatibility |
|----------|------|----------|----------------------|
| **Transaction Pooler** | 6543 | ✅ **RECOMMENDED** - Stateless apps, auto-scaling | Perfect for Railway |
| **Session Pooler** | 5432 | IPv4 fallback, longer sessions | Good for Railway |
| **Direct Connection** | 5432 | Development, debugging only | Not recommended |

## 📝 How to Get Your Database Password

1. Go to [Supabase Dashboard](https://app.supabase.com/projects)
2. Select your project → **Settings** → **Database**
3. Scroll to "Connection string" section
4. Click **Postgres** tab
5. Copy the password from the connection string

## 🔧 Configuration Behavior

| Environment | SUPABASE_POOL_MODE | Result |
|-------------|-------------------|---------|
| Development | (any) | Direct connection |
| Production | `transaction` | Transaction Pooler (port 6543) |
| Production | `session` | Session Pooler (port 5432) |
| Production | `direct` | Direct connection (not recommended) |
| Railway | (auto) | Transaction Pooler (optimal) |

## ✅ Verification

Run this command to test your configuration:
```bash
node test/test-connection-pooling.js
```

Expected result: **12/12 tests passed** ✅

## 🚨 Troubleshooting

### If Transaction Pooler fails:
1. Set `SUPABASE_POOL_MODE=session` (IPv4 fallback)
2. Check Supabase service status
3. Verify database password is correct

### If connection times out:
1. Railway health check timeout is set to 90s
2. Connection includes retry logic with exponential backoff
3. Check Railway logs for specific error messages

## 📊 Performance Benefits on Railway

- **Reduced Connection Overhead**: Pooled connections reused across requests
- **Better Resource Utilization**: Optimal for Railway's 4GB memory allocation  
- **Auto-scaling Compatible**: Works with Railway's container scaling
- **Cost Efficient**: Reduced database connection costs
- **Zero Downtime**: Graceful connection handling during deployments

## 🔄 Migration from Direct Connection

If you're currently using Direct Connection:
1. Add the new environment variables above
2. Redeploy your Railway app
3. No code changes needed - automatic detection
4. Monitor logs for "✅ Using Transaction Pooler" message