# Contributing to ProspectPro

Thank you for your interest in contributing to ProspectPro! This guide will help you get started with contributing to our zero fake data lead generation platform.

## 🚨 Critical Guidelines

### Zero Fake Data Policy

**ALL contributions must maintain our zero tolerance for fake data:**

- ❌ No hardcoded business lists or contact information
- ❌ No sequential address patterns (100 Main St, 110 Main St, etc.)
- ❌ No fake phone numbers (555-xxxx, 000-xxxx patterns)
- ❌ No dummy email addresses or pattern generation
- ✅ All data must come from real API integrations

### Code Standards

- **Real APIs Only**: Use Google Places, Hunter.io, Apollo, NeverBounce, etc.
- **Cost Awareness**: Track and optimize API usage costs
- **Error Handling**: Never fail silently, always log issues appropriately
- **Testing**: Include validation tests for new features

## 🛠️ Development Setup

### Prerequisites

- Node.js 22+
- Supabase account with PostgreSQL database
- API keys: Google Places, Hunter.io, Apollo, NeverBounce

### Installation

```bash
git clone https://github.com/Alextorelli/ProspectPro.git
cd ProspectPro
npm install
cp .env.example .env
# Configure your API keys in .env
```

### Environment Setup

Configure these required environment variables:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SECRET_KEY=your_service_role_key
GOOGLE_PLACES_API_KEY=your_google_places_key
HUNTER_IO_API_KEY=your_hunter_io_key
APOLLO_API_KEY=your_apollo_key
NEVERBOUNCE_API_KEY=your_neverbounce_key
PERSONAL_ACCESS_TOKEN=secure_admin_token
```

## 🔄 Development Workflow

### 1. Fork and Clone

```bash
fork https://github.com/Alextorelli/ProspectPro.git
git clone https://github.com/YOUR_USERNAME/ProspectPro.git
cd ProspectPro
git remote add upstream https://github.com/Alextorelli/ProspectPro.git
```

### 2. Create Feature Branch

```bash
git checkout -b feature/amazing-new-feature
```

### 3. Development Guidelines

- **Module Structure**: Follow existing patterns in `modules/`
- **API Integration**: Add new clients to `modules/api-clients/`
- **Data Validation**: Extend validators in `modules/validators/`
- **Testing**: Add tests to validate real data processing

### 4. Testing Your Changes

#### Workspace Hygiene Check

Before building or pushing, run the ignore validator to ensure no unwanted dev/test/tooling artifacts are present:

```bash
npm run validate:ignores
# Or use the VS Code task: Workspace: Dev Hygiene Check
```

If any files are flagged, update the skip lists in `scripts/tooling/validate-ignore-config.cjs` or clean up the files as needed. This prevents accidental repo pollution and keeps CI/CD clean.

**Note:** The validator runs in CI (Vercel) and will warn (not fail) on hygiene issues. Local enforcement is strict.

```bash
# Data quality validation
node test/test-real-data.js

# Comprehensive system test
node test-comprehensive-webhook-system.js

# Syntax validation
npm run lint
```

### 5. Commit Standards

```bash
git commit -m "feat: add Hunter.io batch processing optimization

- Implement batch email discovery to reduce API costs
- Add rate limiting to prevent quota exhaustion
- Include comprehensive error handling
- Maintains zero fake data policy"
```

## 🧪 Testing Requirements

### Required Tests for New Features

1. **Data Quality Test**: Ensure no fake data patterns
2. **API Integration Test**: Verify real API responses
3. **Cost Optimization Test**: Validate budget controls
4. **Error Handling Test**: Test failure scenarios

### Test Commands

```bash
# Run all data validation tests
npm test

# Check for fake data patterns
grep -r "fake\|dummy\|placeholder" --include="*.js" modules/ api/

# Validate API integrations
node test/test-api-integrations.js

# Test webhook system
node test-comprehensive-webhook-system.js
```

## 📝 Pull Request Process

### 1. Pre-submission Checklist

- [ ] Code follows zero fake data policy
- [ ] All tests pass
- [ ] API costs are optimized and tracked
- [ ] Error handling is comprehensive
- [ ] Documentation is updated
- [ ] No sensitive data (API keys, tokens) in commits

### 2. Pull Request Template

```markdown
## Description

Brief description of changes and motivation

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (would cause existing functionality to not work)
- [ ] Documentation update

## Data Quality Compliance

- [ ] No fake/dummy data generation
- [ ] Real API integrations only
- [ ] Maintains cost optimization
- [ ] Includes proper validation

## Testing

- [ ] Added tests for new functionality
- [ ] All existing tests pass
- [ ] Data quality validation passes
- [ ] API cost tracking verified

## Documentation

- [ ] Updated README.md if needed
- [ ] Added inline code documentation
- [ ] Updated API documentation
```

### 3. Review Process

1. Automated tests must pass
2. Code review by maintainers
3. Data quality validation
4. API cost impact assessment
5. Approval and merge

## 🏗️ Project Architecture

### Core Modules

- **`modules/enhanced-discovery-engine.js`** - Main orchestrator
- **`modules/api-clients/`** - External API integrations
- **`modules/validators/`** - Data quality enforcement
- **`modules/registry-engines/`** - Government data validation
- **`api/webhooks/`** - Event-driven automation

### Adding New Features

1. **API Clients**: Add to `modules/api-clients/` following existing patterns
2. **Validators**: Extend `modules/validators/` with new validation logic
3. **Webhooks**: Add event handlers to `api/webhooks/`
4. **Frontend**: Update `public/` for user interface changes

## 🔍 Code Review Criteria

### What We Look For

- ✅ **Real Data Sources**: Only authentic API integrations
- ✅ **Cost Efficiency**: Optimized API usage patterns
- ✅ **Error Resilience**: Comprehensive error handling
- ✅ **Code Quality**: Clean, maintainable, well-documented code
- ✅ **Testing**: Adequate test coverage with validation

### What We Reject

- ❌ **Fake Data Generation**: Any hardcoded or generated data
- ❌ **Silent Failures**: Code that fails without proper logging
- ❌ **Uncontrolled Costs**: API usage without cost tracking
- ❌ **Poor Error Handling**: Code that breaks user experience
- ❌ **Untested Code**: New features without adequate tests

## 🚀 Deployment Considerations

### Production Readiness

- Database migrations must be backward compatible
- Environment variables properly documented
- Health checks and monitoring included
- Railway deployment compatibility maintained

### Performance Impact

- API rate limiting implemented
- Database query optimization considered
- Memory usage and scaling implications evaluated
- Cost impact on typical usage patterns assessed

## 📚 Resources

### Documentation

- [Main README](../README.md) - Project overview and setup
- [Architecture Documentation](../docs/architecture/) - System design
- [API Documentation](../docs/api/) - Endpoint specifications

### External APIs

- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Hunter.io API](https://hunter.io/api-documentation)
- [Apollo API](https://apolloio.github.io/apollo-api-docs/)
- [NeverBounce API](https://developers.neverbounce.com/)

## 🆘 Getting Help

### Questions and Support

- **GitHub Issues**: [Report issues or ask questions](https://github.com/Alextorelli/ProspectPro/issues)
- **Discussions**: Use GitHub Discussions for general questions
- **Code Review**: Request reviews on pull requests

### Common Issues

1. **API Key Configuration**: Ensure all required keys are set
2. **Supabase Connection**: Verify database connection and permissions
3. **Data Quality Failures**: Check for fake data patterns
4. **Cost Overruns**: Review API usage and rate limiting

---

Thank you for contributing to ProspectPro! Together, we're building the most reliable lead generation platform with authentic, verified business data.
