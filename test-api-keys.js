require('dotenv').config();

// Handle fetch for different Node.js versions
let fetch;
try {
    // Node.js 18+ has built-in fetch
    fetch = globalThis.fetch;
} catch (error) {
    // Fallback to node-fetch for older versions
    fetch = require('node-fetch');
}

/**
 * Quick API Key Verification Script
 * Run: node test-api-keys.js
 * 
 * Tests all API keys and shows quotas/status
 */

async function testGooglePlaces() {
    console.log('\n🗺️  Testing Google Places API...');
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
        console.log('❌ No Google Places API key found');
        return false;
    }
    
    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurant+in+Austin&key=${apiKey}`
        );
        const data = await response.json();
        
        if (data.status === 'OK') {
            console.log('✅ Google Places API working');
            console.log(`📊 Found ${data.results.length} results`);
            return true;
        } else {
            console.log(`❌ Google Places error: ${data.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Google Places connection error: ${error.message}`);
        return false;
    }
}

async function testScrapingDog() {
    console.log('\n🐕 Testing ScrapingDog API...');
    const apiKey = process.env.SCRAPINGDOG_API_KEY;
    
    if (!apiKey) {
        console.log('❌ No ScrapingDog API key found');
        return false;
    }
    
    try {
        const response = await fetch(
            `https://api.scrapingdog.com/scrape?api_key=${apiKey}&url=https://httpbin.org/json`
        );
        
        if (response.ok) {
            console.log('✅ ScrapingDog API working');
            console.log(`📊 Status: ${response.status}`);
            return true;
        } else {
            console.log(`❌ ScrapingDog error: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ScrapingDog connection error: ${error.message}`);
        return false;
    }
}

async function testHunterIo() {
    console.log('\n🎯 Testing Hunter.io API...');
    const apiKey = process.env.HUNTER_IO_API_KEY;
    
    if (!apiKey) {
        console.log('❌ No Hunter.io API key found');
        return false;
    }
    
    try {
        // Test account info endpoint to check key validity
        const response = await fetch(
            `https://api.hunter.io/v2/account?api_key=${apiKey}`
        );
        const data = await response.json();
        
        if (response.ok && data.data) {
            console.log('✅ Hunter.io API working');
            console.log(`📊 Requests used: ${data.data.requests.used}/${data.data.requests.available}`);
            console.log(`💰 Plan: ${data.data.plan_name}`);
            return true;
        } else {
            console.log(`❌ Hunter.io error: ${data.errors?.[0]?.details || 'Invalid response'}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Hunter.io connection error: ${error.message}`);
        return false;
    }
}

async function testNeverBounce() {
    console.log('\n📧 Testing NeverBounce API...');
    const apiKey = process.env.NEVERBOUNCE_API_KEY;
    
    if (!apiKey) {
        console.log('❌ No NeverBounce API key found');
        return false;
    }
    
    try {
        // Test account info endpoint
        const response = await fetch(
            `https://api.neverbounce.com/v4/account/info`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            console.log('✅ NeverBounce API working');
            console.log(`📊 Credits available: ${data.credits_info.paid_credits_available + data.credits_info.free_credits_available}`);
            console.log(`💰 Paid credits: ${data.credits_info.paid_credits_available}`);
            console.log(`🆓 Free credits: ${data.credits_info.free_credits_available}`);
            return true;
        } else {
            console.log(`❌ NeverBounce error: ${data.message || 'Invalid response'}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ NeverBounce connection error: ${error.message}`);
        return false;
    }
}

async function testOpenCorporates() {
    console.log('\n🏢 Testing OpenCorporates API...');
    const apiKey = process.env.OPENCORPORATES_API_KEY;
    
    if (!apiKey) {
        console.log('⚠️  No OpenCorporates API key found (optional - free tier available)');
        
        // Test without API key (free tier)
        try {
            const response = await fetch(
                'https://api.opencorporates.com/v0.4/companies/search?q=apple&jurisdiction_code=us_ca'
            );
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ OpenCorporates free tier working');
                console.log('📊 Daily limit: 200 requests');
                return true;
            } else {
                console.log(`❌ OpenCorporates error: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ OpenCorporates connection error: ${error.message}`);
            return false;
        }
    }
    
    // Test with API key if available
    try {
        const response = await fetch(
            `https://api.opencorporates.com/v0.4/companies/search?q=apple&jurisdiction_code=us_ca&api_token=${apiKey}`
        );
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ OpenCorporates API working');
            console.log(`📊 Found ${data.results?.companies?.length || 0} results`);
            return true;
        } else {
            console.log(`❌ OpenCorporates error: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ OpenCorporates connection error: ${error.message}`);
        return false;
    }
}

async function testSupabase() {
    console.log('\n🗄️  Testing Supabase Connection...');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.log('❌ Missing Supabase credentials');
        return false;
    }
    
    try {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/`,
            {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                }
            }
        );
        
        if (response.ok) {
            console.log('✅ Supabase connection working');
            console.log(`📊 Database URL: ${supabaseUrl}`);
            return true;
        } else {
            console.log(`❌ Supabase error: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Supabase connection error: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 ProspectPro API Key Verification Test');
    console.log('=====================================');
    
    const results = {
        googlePlaces: await testGooglePlaces(),
        scrapingDog: await testScrapingDog(),
        hunterIo: await testHunterIo(),
        neverBounce: await testNeverBounce(),
        openCorporates: await testOpenCorporates(),
        supabase: await testSupabase()
    };
    
    console.log('\n📊 SUMMARY REPORT');
    console.log('=================');
    
    const working = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    console.log(`✅ Working APIs: ${working}/${total}`);
    console.log('\nAPI Status:');
    console.log(`Google Places: ${results.googlePlaces ? '✅ Working' : '❌ Failed'}`);
    console.log(`ScrapingDog: ${results.scrapingDog ? '✅ Working' : '❌ Failed'}`);
    console.log(`Hunter.io: ${results.hunterIo ? '✅ Working' : '❌ Failed'}`);
    console.log(`NeverBounce: ${results.neverBounce ? '✅ Working' : '❌ Failed'}`);
    console.log(`OpenCorporates: ${results.openCorporates ? '✅ Working' : '❌ Failed'}`);
    console.log(`Supabase: ${results.supabase ? '✅ Working' : '❌ Failed'}`);
    
    console.log('\n🎯 DEPLOYMENT READINESS');
    console.log('========================');
    
    if (results.googlePlaces && results.supabase) {
        console.log('✅ READY TO DEPLOY - Core functionality available');
        console.log('🔸 Basic business discovery will work');
        console.log('🔸 Website scraping available');
        
        if (results.hunterIo && results.neverBounce) {
            console.log('✅ ENHANCED FEATURES - Owner discovery fully functional');
        } else {
            console.log('⚠️  PARTIAL FEATURES - Owner discovery needs API key fixes');
        }
    } else {
        console.log('❌ NOT READY - Core APIs missing');
    }
    
    return results;
}

// Run if called directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { runAllTests };