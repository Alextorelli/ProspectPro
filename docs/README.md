# ProspectPro Documentation

## 📚 Documentation Structure

### 🚀 Quick Start
- [API Keys Setup](setup/API_KEYS_SETUP.md) - Configure API keys for external services
- [Campaign Setup](guides/CAMPAIGN_SETUP.md) - Set up and run lead generation campaigns
- [Database Configuration](../database/README.md) - Database setup and configuration

### 📖 User Guides  
- [Business Discovery](guides/BUSINESS_DISCOVERY.md) - How to discover and validate businesses
- [Campaign Management](guides/CAMPAIGN_SETUP.md) - Managing lead generation campaigns
- [CSV Export](guides/CSV_EXPORT.md) - Exporting leads to CSV format

### 🔧 Technical Documentation
- [System Architecture](technical/ARCHITECTURE.md) - System design and components
- [API Reference](technical/API_REFERENCE.md) - Complete API documentation
- [Database Schema](technical/DATABASE_SCHEMA.md) - Database structure and relationships

### 🚢 Deployment
- [Production Deployment](deployment/PRODUCTION_DEPLOYMENT.md) - Deploy to production
- [Supabase Setup](deployment/SUPABASE_SETUP.md) - Configure Supabase backend
- [Monitoring & Diagnostics](deployment/MONITORING.md) - System monitoring and troubleshooting

### 💻 Development
- [Contributing Guidelines](development/CONTRIBUTING.md) - How to contribute to the project
- [Testing Guide](development/TESTING.md) - Running and writing tests
- [Debugging Guide](development/DEBUGGING.md) - Debugging common issues

## 🗄️ Historical Documentation

Historical documents and legacy guides are preserved in dedicated archive branches:

- `archive/development-phase` - Development artifacts and architecture docs
- `archive/deployment-phase` - Deployment experiments and legacy guides  
- `archive/testing-reports` - Test reports and validation documents
- `archive/production-legacy` - Legacy production setup documentation

## 📋 Archive Branch Access

To access historical documentation:

```bash
# List all archive branches
git branch -r | grep archive

# Switch to specific archive branch
git checkout archive/development-phase
git checkout archive/deployment-phase  
git checkout archive/testing-reports
git checkout archive/production-legacy

# Return to main branch
git checkout main
```

## 📏 Documentation Standards

### Root Directory Policy
- **MAXIMUM 3 .md FILES**: README.md, CHANGELOG.md, PRODUCTION_READY_REPORT.md
- All other documentation must be in `docs/` subdirectories

### File Organization
- Setup guides → `docs/setup/`
- User guides → `docs/guides/`
- Technical docs → `docs/technical/`
- Deployment guides → `docs/deployment/`
- Development docs → `docs/development/`

### Naming Conventions
- Use UPPERCASE for major document names
- Use descriptive, specific names
- Include file extensions (.md for markdown)
- Use underscores for multi-word names

## 🔄 Maintenance

This documentation structure is actively maintained:

- **Monthly**: Review for documentation sprawl
- **Per Release**: Update relevant guides and references
- **Per Feature**: Add/update technical documentation
- **Archive Creation**: When starting major new development phases

For questions about documentation structure or to suggest improvements, please create an issue.
