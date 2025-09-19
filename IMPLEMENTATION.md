# ProspectPro - Implementation Guide

## 🎯 Repository Structure & Branch Organization

This repository has been completely reorganized with a clean branch structure to separate production code from development resources.

## 🌳 Branch Structure

### 📦 `main` Branch - Production Code Only

**Connected to Railway for automatic deployment**

Contains only essential production files:

- `server.js` - Production server
- `api/` - Business discovery routes
- `config/` - Database configuration
- `database/` - Schema and RLS policies
- `modules/` - Core business logic
- `public/` - Web interface
- `package.json`, `.env.example`, `railway.toml`

**What's NOT in main:**

- ❌ Documentation files
- ❌ Debug scripts and validation tools
- ❌ Test files and test data
- ❌ Legacy files and archives
- ❌ Development utilities

### 📚 `instructions` Branch - All Documentation

**Switch here for deployment guides and documentation**

```bash
git checkout instructions
```

Organized documentation structure:

```
docs/
├── README.md                    # Documentation hub
├── deployment/
│   └── railway-personal-deployment.md
├── troubleshooting/
│   ├── database-troubleshooting.md
│   └── system-validation.md
├── security/
│   └── security-fixes.md
└── project/
    ├── deployment-status.md
    └── pull-request-analysis.md
```

### 🔧 `debugging` Branch - Development Tools

**Switch here for validation scripts and development utilities**

```bash
git checkout debugging
```

Organized debugging structure:

```
debug/
├── README.md                    # Debug tools guide
├── scripts/                    # Development scripts
│   ├── validate-environment.js
│   ├── check-rls-access.js
│   ├── deployment-readiness.js
│   ├── initialize-database.js
│   └── security-audit.js
├── validation/                  # System validation tools
│   ├── boot-debugger.js
│   ├── deployment-monitor.js
│   ├── prometheus-metrics.js
│   └── security-hardening.js
├── logs/                       # Application logs
└── archive/                    # Legacy files and old docs
```

### 🧪 `testing` Branch - Test Suite

**Switch here for running tests and validation**

```bash
git checkout testing
```

Organized testing structure:

```
tests/
├── README.md                    # Testing guide
├── integration/                 # API integration tests
│   └── test-enhanced-integrations.js
├── validation/                  # Data validation tests
│   ├── test-real-data.js
│   ├── test-website-validation.js
│   └── test-system-settings.js
└── data/                       # Test fixtures
```

## 🚀 Deployment Workflow

### Railway Production Deployment

**Railway is connected to the `main` branch for automatic deployments**

1. **Main branch contains production-ready code only**
2. **All commits to main trigger Railway deployment**
3. **Fast, clean deployments with minimal container size**

```bash
# Deploy to production (Railway watches main branch)
git checkout main
git push origin main
# Railway automatically deploys
```

### Development Workflow

```bash
# 1. Start with production code
git checkout main

# 2. Access documentation
git checkout instructions
# Read docs/deployment/railway-personal-deployment.md

# 3. Use development tools
git checkout debugging
# Run debug/scripts/validate-environment.js

# 4. Run tests
git checkout testing
# Run tests/validation/test-real-data.js

# 5. Return to production
git checkout main
# Make changes and commit for Railway deployment
```

## 🛠️ Development Commands by Branch

### Main Branch (Production)

```bash
git checkout main
npm start                    # Production server
npm run health              # Check server health
curl http://localhost:3000/health
```

### Instructions Branch (Documentation)

```bash
git checkout instructions
# Read documentation in docs/ directory
# All deployment guides and troubleshooting docs here
```

### Debugging Branch (Development Tools)

```bash
git checkout debugging

# Environment validation
node debug/scripts/validate-environment.js

# Database setup and validation
node debug/scripts/initialize-database.js
node debug/scripts/check-rls-access.js

# Deployment readiness
node debug/scripts/deployment-readiness.js

# Security audit
node debug/scripts/security-audit.js
```

### Testing Branch (Quality Assurance)

```bash
git checkout testing

# Data quality tests
node tests/validation/test-real-data.js
node tests/validation/test-website-validation.js

# API integration tests
node tests/integration/test-enhanced-integrations.js

# System configuration tests
node tests/validation/test-system-settings.js
```

## 📋 Implementation Checklist

### Initial Setup

- [ ] Clone repository: `git clone https://github.com/Alextorelli/ProspectPro.git`
- [ ] Review documentation: `git checkout instructions`
- [ ] Set up environment: Copy `.env.example` to `.env` and configure
- [ ] Validate setup: `git checkout debugging && node debug/scripts/validate-environment.js`

### Railway Deployment

- [ ] Connect GitHub repository to Railway
- [ ] Configure environment variables in Railway dashboard
- [ ] Verify Railway is watching `main` branch for deployments
- [ ] Test deployment: `git push origin main`
- [ ] Verify health: `curl https://your-app.railway.app/health`

### Post-Deployment Validation

- [ ] Run tests: `git checkout testing && npm test`
- [ ] Check documentation: `git checkout instructions`
- [ ] Monitor logs: Railway dashboard + `/diag` endpoint
- [ ] Validate API integrations: Test business discovery features

## 🔄 Branch Switching Best Practices

### Quick Reference

```bash
# Production work
git checkout main

# Need documentation?
git checkout instructions && ls docs/

# Need to debug?
git checkout debugging && ls debug/scripts/

# Need to test?
git checkout testing && ls tests/

# Back to production
git checkout main
```

### Working with Multiple Branches

```bash
# Save work before switching
git add . && git commit -m "WIP: current work"

# Switch and work
git checkout debugging
# ... do debugging work ...

# Switch back and continue
git checkout main
# ... continue production work ...
```

## 🎯 Benefits of This Structure

### For Railway Deployment

- ✅ **Fast deployments** - Only production code in main branch
- ✅ **Smaller containers** - No unnecessary files
- ✅ **Clean builds** - No development artifacts
- ✅ **Reliable deploys** - Production-focused code only

### For Development

- ✅ **Organized workflow** - Clear separation of concerns
- ✅ **Easy access** - Quick branch switching for different tasks
- ✅ **Complete tooling** - All development tools preserved but separated
- ✅ **Clean history** - Production commits focused on business logic

### For Maintenance

- ✅ **Clear structure** - Know exactly where to find what you need
- ✅ **Preserved resources** - Nothing is lost, just organized
- ✅ **Scalable approach** - Easy to add new branches for new purposes
- ✅ **Team friendly** - Clear guidelines for where to work

## 🆘 Common Scenarios

### "I need to deploy"

```bash
git checkout main
# Edit production files
git add . && git commit -m "Production update"
git push origin main
# Railway automatically deploys
```

### "I need documentation"

```bash
git checkout instructions
cd docs/
ls deployment/  # Deployment guides
ls troubleshooting/  # Troubleshooting docs
```

### "I need to debug an issue"

```bash
git checkout debugging
node debug/scripts/deployment-readiness.js
node debug/scripts/validate-environment.js
```

### "I need to run tests"

```bash
git checkout testing
node tests/validation/test-real-data.js
```

### "I want to see all branches"

```bash
git branch -a
```

### "I forgot which branch I'm on"

```bash
git branch  # Shows current branch with *
```

## 🎉 You're Ready!

With this clean structure:

- **Railway deployments** are fast and reliable from `main`
- **Development resources** are organized and easily accessible
- **Documentation** is comprehensive and well-structured
- **Testing** and **debugging** tools are preserved and enhanced

Start with: `git checkout instructions` to read the full deployment guide!
