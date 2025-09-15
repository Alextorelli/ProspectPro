# Railway Node.js Compatibility Fix

## Issue Resolution Summary

**Problem**: Railway deployment was failing with `ReferenceError: File is not defined` errors from the `undici` package in Node.js 18.20.8.

**Root Cause**: The @supabase/supabase-js v2.57.4 package and its dependencies require Node.js 20+ due to Web API compatibility requirements.

## Changes Made

### 1. Updated package.json engines
```json
"engines": {
  "node": ">=20.0.0", // Changed from >=18.0.0
  "npm": ">=9.0.0"    // Updated npm requirement
}
```

### 2. Added .nvmrc file
```
20
```
This ensures Railway deploys with Node.js 20 instead of defaulting to Node.js 18.

## Technical Details

**Error Pattern**: 
```
ReferenceError: File is not defined
    at Object.<anonymous> (/app/node_modules/undici/lib/web/webidl/index.js:531:48)
```

**Cause**: The `undici` package (HTTP client used by Supabase) relies on the Web File API that was stabilized in Node.js 20.

**Solution**: Upgrading to Node.js 20+ provides native support for the File constructor and related Web APIs.

## Deployment Verification

After pushing these changes, Railway will:
1. Detect the .nvmrc file and use Node.js 20
2. Install dependencies with Node.js 20 compatibility
3. Successfully start the application without undici errors

## Compatibility Notes

- All existing dependencies are compatible with Node.js 20+
- Local development already uses Node.js 24.5.0
- No breaking changes expected for application functionality
- Performance improvements expected from Node.js 20+ features

## Monitoring

Check Railway logs for:
- ✅ Node.js version 20.x.x in startup logs
- ✅ Successful Supabase client initialization 
- ✅ Application listening on port without errors
- ❌ No more "File is not defined" errors

This fix resolves the deployment compatibility issue while maintaining all existing functionality.