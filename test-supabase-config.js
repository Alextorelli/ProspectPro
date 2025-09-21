#!/usr/bin/env node

/**
 * Supabase Database Configuration Test
 */

const supabaseConfig = require('./config/supabase');

async function testSupabaseConnection() {
  console.log('🔧 Supabase Database Configuration Test');
  console.log('==========================================');
  
  // Check environment variables
  console.log('📋 Environment Configuration:');
  console.log(`   SUPABASE_URL: ${!!process.env.SUPABASE_URL ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   SUPABASE_SECRET_KEY: ${!!process.env.SUPABASE_SECRET_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   SUPABASE_ANON_KEY: ${!!process.env.SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log('');

  try {
    console.log('🔍 Testing database connection...');
    const result = await supabaseConfig.testConnection();
    
    console.log('📊 Connection Test Results:');
    console.log(`   Status: ${result.success ? '✅ Connected' : '❌ Failed'}`);
    
    if (result.client) {
      console.log('   Client: ✅ Initialized');
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.details) {
      console.log('\n🔍 Connection Details:');
      console.log(`   Key Source: ${result.details.keySource || 'Unknown'}`);
      console.log(`   Client Type: ${result.details.clientType || 'Unknown'}`);
      if (result.details.connectionTime) {
        console.log(`   Connection Time: ${result.details.connectionTime}ms`);
      }
    }

    // Test database schema if connected
    if (result.success && result.client) {
      console.log('\n📋 Testing database schema...');
      
      try {
        // Check if main tables exist
        const { data: tables, error: tablesError } = await result.client
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .in('table_name', ['enhanced_leads', 'campaigns', 'api_costs']);
        
        if (tablesError) {
          console.log('   Schema check: ❌ Unable to query tables');
          console.log(`   Error: ${tablesError.message}`);
        } else {
          const tableNames = tables.map(t => t.table_name);
          console.log('   Tables found:');
          console.log(`   - enhanced_leads: ${tableNames.includes('enhanced_leads') ? '✅' : '❌'}`);
          console.log(`   - campaigns: ${tableNames.includes('campaigns') ? '✅' : '❌'}`);
          console.log(`   - api_costs: ${tableNames.includes('api_costs') ? '✅' : '❌'}`);
        }
      } catch (schemaError) {
        console.log('   Schema check: ⚠️ Limited permissions or missing tables');
      }
    }

    console.log('\n' + '='.repeat(50));
    if (result.success) {
      console.log('🎉 Supabase configuration verified successfully!');
      return { success: true };
    } else {
      console.log('❌ Supabase configuration needs attention');
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error('\n❌ Configuration test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack.split('\n').slice(0, 3).join('\n'));
    }
    return { success: false, error: error.message };
  }
}

if (require.main === module) {
  testSupabaseConnection().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { testSupabaseConnection };