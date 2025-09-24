#!/usr/bin/env node
// Quick setup script to add missing GitHub secrets

console.log('🔍 Missing GitHub Secrets Check');
console.log('===============================');

console.log('✅ Configured secrets:');
console.log('   • GCP_SA_KEY');
console.log('   • GHP_TOKEN'); 
console.log('   • SUPABASE_SECRET_KEY');
console.log('   • SUPABASE_URL');
console.log('');

console.log('❌ Missing secrets (add these now):');
console.log('');

console.log('1. GCP_PROJECT_ID');
console.log('   • Go to Google Cloud Console');
console.log('   • Check the project dropdown at the top');
console.log('   • Copy your project ID (not project name)');
console.log('   • Example: "prospectpro-production-123456"');
console.log('');

console.log('2. GCP_REGION');
console.log('   • Set to: us-central1');
console.log('   • This is the region where your Cloud Run service will deploy');
console.log('');

console.log('🚀 After adding these 2 secrets:');
console.log('   1. Go to GitHub Actions tab');
console.log('   2. Click "Deploy to Google Cloud Run" workflow');
console.log('   3. Click "Run workflow" to trigger manual deployment');
console.log('');

console.log('💡 Or push any commit to main branch to auto-trigger deployment');