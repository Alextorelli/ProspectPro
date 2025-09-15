# 🔍 Supabase Connection Details - Step by Step Guide

## Finding Your Database Connection Information

Since the Supabase dashboard interface has changed, here are multiple ways to find your connection details:

### Method 1: Settings → Database (Recommended)

1. **Go to**: https://supabase.com/dashboard/projects
2. **Click your project**: `vvxdprgfltzblwvpedpx`
3. **Click Settings** (gear icon ⚙️ in left sidebar)
4. **Click "Database" tab**

**Look for these sections:**
- **"Connection parameters"** 
- **"Connection pooling"**
- **"Connection string"** (if available)

### Method 2: Settings → API

1. **Same project**: `vvxdprgfltzblwvpedpx`
2. **Settings → API tab**
3. **Find "URL"**: `https://vvxdprgfltzblwvpedpx.supabase.co`
4. **Database host**: Replace `https://` with `db.`
   - Result: `db.vvxdprgfltzblwvpedpx.supabase.co`

### Method 3: Direct Connection Test

Run this test to verify your connection details:

```bash
# Test connection with your details
psql "postgresql://postgres:YOUR_PASSWORD@db.vvxdprgfltzblwvpedpx.supabase.co:5432/postgres?sslmode=require"
```

### Your Exact Connection Details

Based on your project reference `vvxdprgfltzblwvpedpx`:

```yaml
Host: db.vvxdprgfltzblwvpedpx.supabase.co
Port: 5432
Database: postgres
Username: postgres
Password: [Your database password]
SSL Mode: require
```

## If You Can't Find the Password

### Reset Database Password:

1. **Supabase Dashboard → Settings → Database**
2. **Look for "Database password" section**
3. **Click "Generate new password"**
4. **Copy the new password immediately**
5. **Update your environment variables**

### Test Your Connection

Before adding to Grafana, test with this simple script:

```javascript
// test/test-db-connection.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vvxdprgfltzblwvpedpx.supabase.co',
  'your_anon_key_here'
);

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    console.log('✅ Supabase connection successful');
    console.log('Database tables accessible');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
```

## Grafana Connection String Options

### Option A: Individual Fields (Recommended)
```
Host: db.vvxdprgfltzblwvpedpx.supabase.co:5432
Database: postgres
User: postgres
Password: [your_password]
SSL Mode: require
```

### Option B: Connection URI
```
postgresql://postgres:[password]@db.vvxdprgfltzblwvpedpx.supabase.co:5432/postgres?sslmode=require
```

### Option C: With SSL Certificate
```
Host: db.vvxdprgfltzblwvpedpx.supabase.co:5432
Database: postgres
User: postgres
Password: [your_password]
SSL Mode: require
SSL Cert: config/supabase-ca-2021.crt
```

## Common Issues & Solutions

### "Connection refused"
- ✅ Check firewall settings
- ✅ Verify SSL requirement
- ✅ Confirm project reference is correct

### "Authentication failed"
- ✅ Reset database password in Supabase
- ✅ Use exact username: `postgres`
- ✅ Ensure no extra spaces in password

### "SSL required"
- ✅ Set SSL Mode to `require`
- ✅ Upload SSL certificate from `config/supabase-ca-2021.crt`
- ✅ Check TLS/SSL settings in Grafana

## Next Steps

Once you have the connection details:
1. Add them to Grafana PostgreSQL data source
2. Test the connection (should show "Database Connection OK")
3. Import the ProspectPro dashboard
4. Start monitoring your real lead generation data!

---

**Need Help?** 
- Check Supabase logs in Dashboard → Logs
- Test connection with psql command line tool
- Verify environment variables match these settings