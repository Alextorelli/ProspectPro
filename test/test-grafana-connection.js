// Test Supabase connection with new password
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function testSupabaseConnection() {
  console.log('🔌 Testing Supabase connection with new password...\n');
  
  const pool = new Pool({
    user: 'postgres',
    host: 'db.vvxdprgfltzblwvpedpx.supabase.co',
    database: 'postgres',
    password: 'aqDw8YTgQQK2bxgy',
    port: 5432,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync(path.join(__dirname, '../config/supabase-ca-2021.crt'))
    }
  });

  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test monitoring tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('campaigns', 'businesses', 'api_usage', 'api_cost_tracking', 'service_health_metrics')
    `);
    
    console.log('✅ Monitoring tables found:', tablesResult.rows.map(r => r.table_name));
    
    // Test sample query for Grafana
    const sampleQuery = await client.query(`
      SELECT 
        COUNT(*) as total_campaigns,
        COALESCE(SUM(current_cost), 0) as total_cost,
        COUNT(*) FILTER (WHERE status = 'active') as active_campaigns
      FROM campaigns
      LIMIT 1
    `);
    
    console.log('✅ Sample Grafana query result:', sampleQuery.rows[0]);
    
    client.release();
    console.log('\n🎉 Ready for Grafana! Your connection settings are working.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n💡 Check:');
    console.log('1. Password is correct: aqDw8YTgQQK2bxgy');
    console.log('2. SSL certificate exists: config/supabase-ca-2021.crt');
    console.log('3. Supabase project is active');
  } finally {
    await pool.end();
  }
}

testSupabaseConnection();