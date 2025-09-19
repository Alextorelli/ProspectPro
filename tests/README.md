# ProspectPro - Testing Suite

This branch contains all test files, test data, and testing utilities for ProspectPro.

## Directory Structure

```
tests/
├── integration/       # API integration tests
│   └── test-enhanced-integrations.js
├── validation/        # Data validation and quality tests
│   ├── test-real-data.js
│   ├── test-website-validation.js
│   └── test-system-settings.js
└── data/             # Test data and fixtures
```

## Running Tests

### Prerequisites
```bash
# Ensure you're on the testing branch
git checkout testing

# Install dependencies (if not already done)
npm install
```

### Individual Test Categories

#### Integration Tests
Test API integrations with external services:
```bash
# Test Google Places, Hunter.io, NeverBounce integrations
node tests/integration/test-enhanced-integrations.js
```

#### Data Validation Tests
Test data quality and validation logic:
```bash
# Verify zero fake data enforcement
node tests/validation/test-real-data.js

# Test website accessibility validation
node tests/validation/test-website-validation.js

# Validate system settings and configuration
node tests/validation/test-system-settings.js
```

### Complete Test Suite
```bash
# Run all tests in sequence
npm run test

# Or manually run all tests
node tests/validation/test-real-data.js
node tests/validation/test-website-validation.js
node tests/validation/test-system-settings.js
node tests/integration/test-enhanced-integrations.js
```

## Test Categories

### Integration Tests (`tests/integration/`)
- **API Integration Tests** - Validate connections to Google Places, Hunter.io, NeverBounce
- **Database Integration Tests** - Test Supabase connections and queries
- **End-to-end Tests** - Complete workflow validation

### Validation Tests (`tests/validation/`)
- **Data Quality Tests** - Ensure zero fake data in results
- **Website Validation** - Test URL accessibility and response codes
- **System Configuration** - Validate environment setup and API keys
- **Business Logic** - Test lead qualification and scoring logic

## Test Data (`tests/data/`)
This directory contains test fixtures and sample data for testing purposes. 

**Important**: All test data follows the same "zero fake data" policy as production.

## Quality Standards

### Expected Test Results
- **Data Accuracy**: >95% of test leads must be verifiable
- **Website Success Rate**: 100% of tested URLs must be accessible
- **Email Deliverability**: <5% bounce rate on test emails
- **API Response Times**: <2 seconds for all API calls

### Zero Fake Data Policy
All tests validate against real data sources:
- ✅ Real business names from Google Places API
- ✅ Real addresses that geocode successfully
- ✅ Real phone numbers in valid formats
- ✅ Real websites that return HTTP 200-399
- ✅ Real email addresses that pass deliverability checks

### Failure Criteria
Tests will fail if they detect:
- ❌ Hardcoded business arrays
- ❌ Sequential fake addresses
- ❌ 555/000 phone number patterns
- ❌ Non-accessible websites
- ❌ Generic business names

## Development Workflow

1. **Switch to testing branch**:
   ```bash
   git checkout testing
   ```

2. **Run validation tests** before deployment:
   ```bash
   node tests/validation/test-real-data.js
   ```

3. **Test API integrations**:
   ```bash
   node tests/integration/test-enhanced-integrations.js
   ```

4. **Validate system configuration**:
   ```bash
   node tests/validation/test-system-settings.js
   ```

## Integration with Other Branches

These tests validate code from other branches:

- **`main`** - Production code testing and validation
- **`debugging`** - Use debugging tools for test troubleshooting
- **`instructions`** - Reference documentation for test requirements

## CI/CD Integration

For automated testing on Railway deployment:

1. Tests can be run as part of build process
2. Validation tests ensure data quality before deployment
3. Integration tests verify API connectivity in production environment

## Adding New Tests

When adding new tests:

1. Follow the zero fake data policy
2. Use real API endpoints and data sources  
3. Add appropriate error handling and timeouts
4. Document expected results and failure criteria
5. Ensure tests are reproducible and environment-independent

## Branch Strategy

- **`main`** - Production code only
- **`debugging`** - Development and debugging tools
- **`testing`** - This branch (all test files and test data)
- **`instructions`** - Documentation and deployment guides

Switch between branches as needed:
```bash
git checkout main        # Production deployment
git checkout debugging   # Development tools
git checkout testing     # Running tests  
git checkout instructions # Reading documentation
```