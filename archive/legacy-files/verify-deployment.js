#!/usr/bin/env node

/**
 * Quick deployment verification - checks if web app is ready for Railway
 * Run: node verify-deployment.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 ProspectPro Deployment Verification\n');

const checks = [
  {
    name: 'Server file exists',
    check: () => fs.existsSync('./server.js'),
    fix: 'Create server.js file'
  },
  {
    name: 'Package.json valid',
    check: () => {
      try {
        const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        return pkg.scripts?.start && pkg.engines?.node;
      } catch (e) {
        return false;
      }
    },
    fix: 'Fix package.json format'
  },
  {
    name: 'Public files exist',
    check: () => fs.existsSync('./public/index.html') && fs.existsSync('./public/admin-dashboard.html'),
    fix: 'Create public directory with HTML files'
  },
  {
    name: 'Railway config exists',
    check: () => fs.existsSync('./railway.toml'),
    fix: 'Create railway.toml configuration'
  },
  {
    name: 'Database schema exists',
    check: () => fs.existsSync('./database/enhanced-supabase-schema.sql'),
    fix: 'Create database schema file'
  }
];

let allPassed = true;

checks.forEach(({ name, check, fix }) => {
  const passed = check();
  console.log(`${passed ? '✅' : '❌'} ${name}`);
  if (!passed) {
    console.log(`   → ${fix}`);
    allPassed = false;
  }
});

console.log('\n' + (allPassed ? 
  '🎉 Ready for deployment! Follow DEPLOYMENT_GUIDE.md' : 
  '⚠️  Fix the issues above before deploying'));

console.log('\nNext steps:');
console.log('1. Follow DEPLOYMENT_GUIDE.md');
console.log('2. Deploy to Railway via web dashboard');
console.log('3. Access admin dashboard at your-app.railway.app/admin-dashboard.html');