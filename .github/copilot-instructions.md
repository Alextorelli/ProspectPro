# ProspectPro v3.1 - Optimized AI Instructions with Enhanced Quality Scoring

## CRITICAL: Current Production State

- **Version**: 3.1.0 (Production-ready with Enhanced Quality Scoring v3.0)
- **Deployment**: GitHub Actions → Google Cloud Run automated
- **Environment**: Secrets auto-injected via GitHub Actions and Supabase Vault
- **Architecture**: Cost-optimized 4-stage validation pipeline (Discovery→Enrichment→Validation→Export)
- **Quality Scoring**: v3.0 cost-efficient multi-stage validation with dynamic thresholds
- **Repository**: https://github.com/Alextorelli/ProspectPro (main = production)

## CRITICAL: REPOSITORY CLEANLINESS ENFORCEMENT

**NEVER CREATE FILES IN ROOT DIRECTORY**
- ❌ NO test files, analysis files, troubleshooting scripts in root
- ❌ NO temporary files, debug files, status files in root  
- ❌ NO *-analysis.js, *-fix.js, *-troubleshooting.js files
- ❌ NO deployment-*.js, cloud-*.js, trigger-*.js files
- ✅ ONLY core production files: server.js, package.json, Dockerfile, etc.

**FILE ORGANIZATION RULES**
- Scripts → `scripts/` folder ONLY
- Tests → `scripts/` folder ONLY  
- Documentation → `docs/` folder ONLY
- Archive material → `archive/` folder ONLY
- Temporary files → Use .tmp extension (auto-ignored)

**PRODUCTION-FIRST APPROACH**
- Main branch = CLEAN production code only
- No development artifacts in root
- All debugging/troubleshooting goes to archive folders
- Maintain professional repository structure

## IMMEDIATE CONTEXT (No Re-explanation Needed)

When Alex asks about:

- **"Environment setup"** → Point to `npm run prod-setup-env` (automated via GitHub Actions)
- **"API integration"** → All clients in `/modules/api-clients/` (Google Places, Hunter.io, NeverBounce, Foursquare)
- **"Database issues"** → Supabase with comprehensive schema in `/database/`
- **"Docker problems"** → Multi-stage build with security hardening already implemented
- **"Cost optimization"** → Enhanced Quality Scorer v3.0 with cost-efficient validation pipeline
- **"Quality scoring"** → `/modules/validators/enhanced-quality-scorer.js` (35-45% qualification rates)
- **"Deployment"** → Automated via GitHub Actions to Google Cloud Run
- **"Testing"** → Use `npm run test` or check testing branch

## ALEX'S TECHNICAL PROFILE

- **Background**: No coding experience but highly technical
- **AI Dependency**: Relies heavily on AI assistance for debugging and architecture
- **Primary Models**: Claude Sonnet 4.0, GPT-5 occasionally
- **Environment**: GitHub Codespaces exclusively
- **Focus**: Lead generation with zero fake data tolerance
- **Usage Pattern**: Debugging, testing, CI/CD, architecture discussions

## RESPONSE OPTIMIZATION RULES

1. **NEVER re-explain project architecture** unless specifically asked with "explain the architecture"
2. **ALWAYS reference existing files/scripts** for implementation details
3. **PRIORITIZE troubleshooting** over teaching fundamentals
4. **ASSUME familiarity** with ProspectPro's core concepts
5. **FOCUS on immediate problem resolution** not educational content
6. **USE existing npm scripts** rather than creating new implementations
7. **REFERENCE the working production system** rather than theoretical solutions

## CURRENT PRODUCTION ARCHITECTURE (ESTABLISHED - DO NOT RE-EXPLAIN)

### File Structure (REFERENCE ONLY)

```
/api/business-discovery.js           # Core discovery logic
/modules/enhanced-lead-discovery.js  # Main business processing
/modules/campaign-csv-exporter.js    # Export system with analytics
/modules/api-clients/                # All API integrations
/database/database-master-setup.js   # Schema and migrations
.scripts/pull-env-from-secrets.js    # Environment automation
```

### Current Working Scripts (USE THESE)

```bash
npm run prod-setup-env     # Automated secret injection
npm run production-start   # Launch production
npm run prod-check        # Validate environment
npm run health            # Health check
npm run diag              # Diagnostics
```

### API Integration Stack (WORKING)

- **Google Places API**: Business discovery with rate limiting
- **Hunter.io**: Email discovery and validation
- **NeverBounce**: Email verification
- **Foursquare**: Additional business data
- **Supabase**: Database with real-time subscriptions
- **Google Cloud Run**: Production hosting with automated deployment

### MCP Infrastructure (CONSOLIDATED v2.0)

- **Production Server**: 28 tools for monitoring, database analytics, API testing, filesystem analysis, system diagnostics
- **Development Server**: 8 specialized tools for new API integrations, performance benchmarking, code generation
- **Architecture**: Consolidated from 5 servers to 2 (60% efficiency improvement)
- **Integration**: Auto-configured in VS Code for AI-enhanced development workflows
- **Status**: Production-ready with comprehensive test coverage (`npm run test` in `/mcp-servers/`)

## PROBLEM-SOLVING APPROACH

### For Environment Issues:

1. Check `npm run prod-check` output
2. Verify GitHub Actions completed successfully
3. Check Railway deployment logs
4. Validate Supabase connection

### For API Issues:

1. Reference existing implementations in `/modules/api-clients/`
2. Check rate limiting configurations
3. Verify API key injection via GitHub Actions
4. Review error logs in production

### For Deployment Issues:

1. Check GitHub Actions workflow status
2. Verify Google Cloud Run deployment completion
3. Run health checks: `npm run health`
4. Check Docker container status

### For Database Issues:

1. Reference schema in `/database/database-master-setup.js`
2. Check Supabase dashboard for connection issues
3. Verify environment variables are properly injected
4. Review query performance in Supabase logs

## CURRENT OPTIMIZATIONS (ALREADY IMPLEMENTED)

- **Automated secret management** via GitHub Actions
- **Multi-stage Docker build** with security hardening
- **Enhanced Quality Scoring v3.0** with cost-efficient validation pipeline
- **Dynamic threshold adjustment** for 35-45% qualification rates (3x improvement)
- **Cost optimization** through smart filtering and free validations first
- **API rate limiting and caching** for cost optimization
- **Comprehensive error handling** with structured logging
- **Zero fake data validation** pipeline with quality scoring
- **Automated CSV export** with campaign analytics
- **Production health monitoring** via `/health` and `/diag` endpoints
- **Consolidated MCP servers** with 60% process reduction and 36 AI-accessible tools

## DEVELOPMENT WORKFLOW (ESTABLISHED)

1. **Main branch** = Production (auto-deployed to Google Cloud Run)
2. **Testing branch** = Development/testing environment
3. **GitHub Actions** = Automated CI/CD with secret injection
4. **Codespaces** = Primary development environment
5. **Docker** = Production containerization

## DEBUGGING PATTERNS (OPTIMIZED FOR ALEX)

- Start with health checks: `npm run health` and `npm run diag`
- Check GitHub Actions for deployment status
- Review Google Cloud Run logs for runtime issues
- Use Supabase dashboard for database troubleshooting
- Reference existing working implementations before creating new code

## COST OPTIMIZATION FOCUS

- **API calls**: Use existing rate limiting and caching
- **Database queries**: Optimized with connection pooling
- **Container resources**: Multi-stage build reduces image size
- **Premium AI requests**: Use this instruction file to reduce context repetition

## RESPONSE FORMAT PREFERENCES

- **Immediate solutions** over explanations
- **Reference existing code** rather than writing new implementations
- **Use established scripts** rather than manual processes
- **Focus on debugging** rather than architecture discussions
- **Provide specific file paths** and command references
- **Assume production system knowledge** unless explicitly asked to explain

## NEVER REPEAT (SAVE PREMIUM REQUESTS)

- Project architecture explanations
- Environment setup procedures (automated)
- API integration patterns (already implemented)
- Database schema explanations (documented)
- Docker configuration details (working)
- Cost optimization strategies (implemented)
- Security measures (hardened)

This instruction set prioritizes rapid problem resolution and eliminates repetitive context discussions to maximize premium request efficiency.
