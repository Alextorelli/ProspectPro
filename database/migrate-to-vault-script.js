/**
 * ProspectPro Vault Migration Script
 * Migrates secrets from app_secrets table to Supabase Vault
 * 
 * Usage: node database/migrate-to-vault.js [--dry-run]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const DRY_RUN = process.argv.includes('--dry-run');
const REQUIRED_SECRETS = [
    'GOOGLE_PLACES_API_KEY',
    'FOURSQUARE_API_KEY', 
    'HUNTER_IO_API_KEY',
    'ZEROBOUNCE_API_KEY',
    'NEVERBOUNCE_API_KEY',
    'SCRAPINGDOG_API_KEY',
    'APOLLO_API_KEY',
    'PERSONAL_ACCESS_TOKEN'
];

async function main() {
    console.log('🔐 ProspectPro Vault Migration');
    console.log('==============================');
    
    if (DRY_RUN) {
        console.log('🔍 DRY RUN MODE - No changes will be made');
    }
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ SUPABASE_URL or SUPABASE_SECRET_KEY missing');
        process.exit(1);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
        // Step 1: Enable Vault extension
        console.log('\n📦 Step 1: Enabling Vault extension...');
        
        if (!DRY_RUN) {
            const { error: extensionError } = await supabase.rpc('sql', {
                query: 'CREATE EXTENSION IF NOT EXISTS "vault" WITH SCHEMA "vault"'
            });
            
            if (extensionError) {
                console.warn('⚠️  Extension creation warning:', extensionError.message);
            } else {
                console.log('✅ Vault extension enabled');
            }
        } else {
            console.log('📝 Would enable vault extension');
        }
        
        // Step 2: Check existing secrets in app_secrets
        console.log('\n📋 Step 2: Checking existing app_secrets...');
        
        let existingSecrets = [];
        try {
            const { data: appSecrets, error: appSecretsError } = await supabase
                .from('app_secrets')
                .select('key, value');
            
            if (appSecretsError) {
                console.log('ℹ️  No app_secrets table found or accessible');
                existingSecrets = [];
            } else {
                existingSecrets = appSecrets || [];
                console.log(`📊 Found ${existingSecrets.length} existing secrets in app_secrets`);
            }
        } catch (err) {
            console.log('ℹ️  app_secrets table not accessible, creating new vault secrets');
            existingSecrets = [];
        }
        
        // Step 3: Check current vault status
        console.log('\n🔍 Step 3: Checking vault status...');
        
        let vaultSecrets = [];
        try {
            const { data: vaultData, error: vaultError } = await supabase
                .from('vault.secrets')
                .select('name');
                
            if (vaultError) {
                console.warn('⚠️  Vault query warning:', vaultError.message);
                vaultSecrets = [];
            } else {
                vaultSecrets = vaultData || [];
                console.log(`📊 Found ${vaultSecrets.length} existing secrets in vault`);
            }
        } catch (err) {
            console.log('ℹ️  Vault not accessible yet');
        }
        
        // Step 4: Migrate or create vault secrets
        console.log('\n🔄 Step 4: Processing secrets...');
        
        const results = {
            migrated: 0,
            created: 0,
            skipped: 0,
            errors: 0
        };
        
        for (const secretName of REQUIRED_SECRETS) {
            try {
                // Check if already exists in vault
                const existsInVault = vaultSecrets.some(s => s.name === secretName);
                
                if (existsInVault) {
                    console.log(`⏭️  ${secretName}: Already exists in vault, skipping`);
                    results.skipped++;
                    continue;
                }
                
                // Get value from app_secrets if available
                const existingSecret = existingSecrets.find(s => s.key === secretName);
                const secretValue = existingSecret?.value || 'CONFIGURE_IN_SUPABASE_DASHBOARD';
                const description = `ProspectPro API Key - ${secretName}`;
                
                if (!DRY_RUN) {
                    // Create vault secret using raw SQL since vault functions might not be exposed
                    const { error: createError } = await supabase.rpc('sql', {
                        query: `SELECT vault.create_secret($1, $2, $3)`,
                        params: [secretValue, secretName, description]
                    });
                    
                    if (createError) {
                        console.error(`❌ ${secretName}: Failed to create -`, createError.message);
                        results.errors++;
                    } else {
                        if (existingSecret) {
                            console.log(`✅ ${secretName}: Migrated from app_secrets`);
                            results.migrated++;
                        } else {
                            console.log(`✅ ${secretName}: Created with placeholder`);
                            results.created++;
                        }
                    }
                } else {
                    if (existingSecret) {
                        console.log(`📝 ${secretName}: Would migrate from app_secrets`);
                        results.migrated++;
                    } else {
                        console.log(`📝 ${secretName}: Would create with placeholder`);
                        results.created++;
                    }
                }
                
            } catch (err) {
                console.error(`❌ ${secretName}: Error -`, err.message);
                results.errors++;
            }
        }
        
        // Step 5: Summary
        console.log('\n📊 Migration Summary:');
        console.log('====================');
        console.log(`✅ Migrated: ${results.migrated}`);
        console.log(`🆕 Created: ${results.created}`);  
        console.log(`⏭️  Skipped: ${results.skipped}`);
        console.log(`❌ Errors: ${results.errors}`);
        
        if (results.errors > 0) {
            console.log('\n⚠️  Some errors occurred. Check logs above.');
            process.exit(1);
        }
        
        if (!DRY_RUN) {
            console.log('\n🎉 Vault migration completed successfully!');
            console.log('📝 Next steps:');
            console.log('   1. Configure actual API keys in Supabase Dashboard');
            console.log('   2. Test secret loading with updated server.js');
            console.log('   3. Remove app_secrets table after confirming vault works');
        } else {
            console.log('\n📝 Dry run completed. Run without --dry-run to apply changes.');
        }
        
    } catch (err) {
        console.error('💥 Migration failed:', err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };