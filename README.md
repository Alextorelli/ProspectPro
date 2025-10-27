# ProspectPro v4.3 - Tier-Aware Background Discovery Platform

**🚀 PRODUCTION READY** - User-Aware Business Discovery with Complete Authentication

## ✨ Live Platform

**🌐 Access:** https://prospect-fyhedobh1-appsmithery.vercel.app

## 🎯 Core Features

### 🔐 User-Aware System

- **Anonymous Users:** Session-based workflow with automatic campaign tracking
- **Authenticated Users:** Permanent campaign storage with complete history
- **Seamless Upgrade:** Anonymous campaigns automatically link upon signup
- **Data Isolation:** User-specific access with database-level security

### 📊 Business Discovery

- **16 Business Categories** with 300+ optimized business types
- **Asynchronous Background Jobs** with real-time progress + campaign inserts
- **Multi-Source Discovery** - Google Places, Place Details, and Foursquare with dedupe
- **Census-Guided Targeting** - Automatic radius + density scoring when `CENSUS_API_KEY` is present
- **Verified Contact Data** - No fake emails or generated patterns
- **3-Tier Data Enhancement** with progressive pricing and transparent feature controls

## 🎯 Tier Structure

### Base Tier ($0.15/lead) - "Essential Business Data"

**Perfect for targeted outreach campaigns**

- ✅ Business verification
- ✅ Company data (name, industry, size)
- ✅ Phone & address validation
- ✅ Generic company email

### Professional Tier ($0.45/lead) - "Enhanced Sales Intelligence"

**Verified contacts for higher conversion rates**

- ✅ Everything in Base
- ✅ Professional email discovery & verification
- ✅ Email deliverability verification
- ✅ Enhanced company enrichment

### Enterprise Tier ($2.50/lead) - "Premium Executive Access"

**Compliance-grade data with C-suite contacts**

- ✅ Everything in Professional
- ✅ Executive contact enrichment
- ✅ Full compliance verification
- ✅ Advanced data validation

### 📧 Email Verification Pipeline

- **Hunter.io Integration** - Professional email discovery ($0.034/search)
- **NeverBounce Verification** - Real-time deliverability (95% accuracy)
- **Executive Contact Discovery** - C-suite contacts for Enterprise tier
- **Multi-source Verification** - Professional licensing and directories

### 📤 Export & Management

- **User-Authorized Exports** - CSV/JSON with complete enrichment data
- **Campaign History** - User-specific campaign tracking and management
- **Export Analytics** - Download tracking with user context
- **Data Privacy** - Complete user data isolation and access control

## 🏗️ Architecture

## Agent Orchestration (MECE Taxonomy)

ProspectPro now uses a MECE-aligned agent orchestration model:

Hydrate agent credentials into the git-ignored `dev-tools/agents/.env.agent.local` via provider CLIs (Vercel, Supabase, GitHub) before running validation; never commit populated secrets—only the template `dev-tools/agents/.env.agent.example`.

See [`dev-tools/workspace/context/session_store/MCP_MODE_TOOL_MATRIX.md`](dev-tools/workspace/context/session_store/MCP_MODE_TOOL_MATRIX.md) for the full agent × MCP matrix and [`mece-agent-mcp-integration-plan.md`](dev-tools/workspace/context/session_store/mece-agent-mcp-integration-plan.md) for responsibilities and escalation paths.

---

### Supabase-First Serverless & MCP Telemetry

- **Frontend:** React/Vite deployed to Vercel
- **Backend:** 6 Supabase Edge Functions with global deployment
- **Database:** PostgreSQL with Row Level Security (RLS) and user isolation
- **Authentication:** Supabase Auth with JWT tokens and session management
- **Real-time:** Ready for live updates and notifications
- **Telemetry & Diagnostics:** MCP troubleshooting server exposes tools for API trace capture, campaign cost comparison, and ROI prediction, integrated with OTEL collector and Supabase logs.

### User-Aware Data Model

```sql
-- User-linked campaigns with session support
campaigns (id, business_type, location, user_id, session_user_id, ...)

-- Verified leads with user context
leads (id, campaign_id, business_name, email, user_id, session_user_id, ...)

-- User-authorized exports
dashboard_exports (id, campaign_id, user_id, session_user_id, ...)
```

### Edge Functions & MCP Tools (Production, Supabase Session Required)

- **Discovery**
  - `business-discovery-background` – Tier-aware asynchronous discovery + enrichment orchestration
  - `business-discovery-optimized` – Session-aware synchronous path for scoped validation
  - `business-discovery-user-aware` (legacy) – Retained for historical integrations
- **Enrichment & Coordination**
  - `enrichment-hunter` – Hunter.io email discovery with caching and circuit breakers
  - `enrichment-neverbounce` – Email verification with quota management
  - `enrichment-orchestrator` – Multi-service coordination + budget enforcement
  - `enrichment-business-license` / `enrichment-pdl` – Licensing + data compliance enrichment
- **Export**
  - `campaign-export-user-aware` – User-authorized export with enrichment metadata
  - `campaign-export` – Internal automation export path (service-role only)
- **Diagnostics & Telemetry**
  - `test-new-auth` – Session diagnostics for the shared auth helper
  - `test-official-auth` – Mirrors Supabase’s reference pattern end-to-end
  - `test-business-discovery` – Session-scoped discovery smoke test
  - `test-google-places` – API testing and validation
  - MCP troubleshooting server tools:
    - `capture_api_trace` – Capture OTEL traces for API calls
    - `compare_campaign_costs` – Aggregate cost metrics from Supabase logs and OTEL traces
    - `predict_campaign_roi` – Predict campaign ROI using cost, enrichment, and validation telemetry

## 🧪 Quality Standards

### Zero Fake Data Philosophy

- ✅ **Verified Contacts Only** - No pattern-generated emails
- ✅ **Professional Sources** - Hunter.io, licensing boards, chambers
- ✅ **Transparent Attribution** - Clear source tracking for all data
- ✅ **Quality Baseline** - 95% email deliverability assumed
- ❌ **No Speculative Data** - No info@, contact@, or generated patterns

### Verification Sources

- **Google Place Details API** - 100% phone/website verification
- **Hunter.io API** - Professional email discovery with confidence scoring
- **NeverBounce API** - Real-time email deliverability verification
- **Professional Licensing** - State boards (CPA, Healthcare, Legal)
- **Chamber of Commerce** - Membership verification and directories

## 🚀 User Experience

### Anonymous Users

1. **Instant Access** - No signup required to start discovering
2. **Session Tracking** - Automatic campaign management during session
3. **Full Functionality** - Complete discovery and export capabilities
4. **Upgrade Prompts** - Clear path to permanent account creation

### Authenticated Users

1. **Permanent Storage** - All campaigns saved to user account
2. **Campaign History** - Access to all previous discoveries
3. **Data Privacy** - Complete isolation from other users
4. **Enhanced Features** - Priority support and advanced analytics

## 📊 Performance Metrics

### System Performance

- **Response Time:** <100ms cold start (Edge Functions)
- **Uptime:** 99.9% (Supabase + Vercel infrastructure)
- **Scalability:** Auto-scaling serverless architecture
- **Cost Efficiency:** 90% reduction vs traditional server deployment

### Data Quality

- **Email Accuracy:** 95% deliverability rate
- **Contact Verification:** Multi-source validation
- **Business Data:** Real-time updates via Google Places API
- **Quality Scoring:** Intelligent confidence assessment

## 🔧 Development

### Prerequisites

- Node.js 18+
- Supabase CLI (`npm install -g supabase`)
- Vercel CLI (`npm install -g vercel`)
- GitHub CLI (`brew install gh` or see https://cli.github.com/manual/installation)

### Setup

```bash
# Clone repository
git clone https://github.com/Alextorelli/ProspectPro.git
cd ProspectPro

# Install dependencies
npm install

# Validate ignore hygiene (run after any ignore file change)
node integration/infrastructure/scripts/validate-ignore-config.cjs

# Start Supabase (local development)
supabase start

# Deploy Edge Functions
supabase functions deploy business-discovery-background
supabase functions deploy campaign-export-user-aware
supabase functions deploy enrichment-orchestrator

# Stream background discovery logs
Open the Supabase dashboard → Edge Functions → business-discovery-background → Logs for live output.

# Build and deploy frontend
npm run build
cd dist && vercel --prod
```

### Testing

```bash
# Test background discovery function directly
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/business-discovery-background' \
  -H 'Authorization: Bearer SUPABASE_SESSION_JWT' \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "restaurant", "location": "Seattle, WA", "maxResults": 3, "tierKey": "PROFESSIONAL", "sessionUserId": "dev-smoke"}'

# Test export functionality
curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/campaign-export-user-aware' \
  -H 'Authorization: Bearer SUPABASE_SESSION_JWT' \
  -H 'Content-Type: application/json' \
  -d '{"campaignId": "campaign_123", "format": "csv"}'
```

### MCP Service Layer (Phase 4)

The MCP (Model Context Protocol) Service Layer provides production-ready client management, configuration, and observability integration:

```bash
# Build and test MCP service layer
cd dev-tools/agents/mcp
npm install
npm run build
npm test

# Deploy MCP service layer to production
../../../scripts/operations/deploy-mcp-service-layer.sh

# Start MCP servers for development
npm run mcp:start

# Monitor MCP operations with tracing
# Traces available at: http://localhost:16686 (Jaeger UI)
```

**Key Features:**

- **Production Deployment**: Automated deployment with systemd integration
- **OpenTelemetry Tracing**: Built-in distributed tracing with Jaeger backend
- **Concurrent Safety**: Promise caching for safe concurrent client access
- **Retry Logic**: Exponential backoff with configurable retry strategies
- **Type Safety**: Full TypeScript support with comprehensive test coverage

**Integration Points:**

- Connects to existing MCP servers (production, development, troubleshooting)
- Integrates with observability stack for monitoring and alerting
- Supports both development mocking and production implementations

# Run Supabase-auth diagnostics

curl -X POST 'https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/test-new-auth' \
 -H 'Authorization: Bearer SUPABASE_SESSION_JWT' \
 -H 'Content-Type: application/json' \
 -d '{"diagnostics": true}'

```

## 🎯 Roadmap

### 🌀 MCP Rework Implementation & Telemetry Operationalization

**Goal:** Establish AI agent automation and operationalize MCP telemetry tools for diagnostics, cost analysis, and ROI prediction.

#### ✅ Completed Phases

- **Phase 1: Workspace Staging** - Dependency alignment and MCP configuration
- **Phase 2: MCP Server Scaffolding** - 6 specialized MCP servers created
- **Phase 3: Agent Suite Creation** - AI agent orchestration framework
- **Phase 4: Script/Task Sync** - 4/10+ scripts migrated to MCP workflows
- **Phase 5: Observability Setup** - Distributed tracing infrastructure established
- **Phase 6: Telemetry Tool Integration** - MCP troubleshooting server exposes `capture_api_trace`, `compare_campaign_costs`, and `predict_campaign_roi` tools, integrated with OTEL collector and Supabase logs.

#### 🌀 Current Phase: Validation Harness & Coverage

- MCP server health checks and smoke tests
- Full-stack validation with tracing and telemetry enabled
- Documentation and diagram update for new tools and flows

#### 📋 Remaining Work

- **Script Migration** - Complete refactoring of remaining 6+ test scripts
- **VS Code Integration** - Update tasks.json to invoke MCP tools
- **Documentation** - Update technical docs and diagrams with telemetry and troubleshooting patterns
- **Testing Integration** - Automated validation with distributed tracing and MCP telemetry tools

#### 🏗️ Infrastructure Status

- **MCP Servers:** 6 servers operational (production, development, troubleshooting, postgresql, integration-hub, observability)
- **Observability Stack:** Jaeger + Prometheus + Grafana configured for distributed tracing
- **Agent Orchestration:** Ready for AI workflow automation
- **Telemetry Tools:** MCP troubleshooting server operational with OTEL and Supabase log integration
- **Script Reduction:** 40% achieved, targeting 70-80% total reduction

#### 🔍 Observability Features

- **Distributed Tracing:** OpenTelemetry with Jaeger visualization
- **Performance Monitoring:** Request duration and error tracking
- **Workflow Correlation:** Trace correlation across MCP server interactions
- **Health Checks:** System diagnostics and connectivity validation
- **Metrics Collection:** Prometheus integration with custom dashboards
- **Telemetry Tools:** API trace capture, campaign cost comparison, ROI prediction via MCP troubleshooting server

**Access Points:**

- Jaeger UI: http://localhost:16686
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- MCP Observability Server: `npm run start:observability`

## 🛠️ Troubleshooting

**Blank screen after campaign completes** – Indicates the browser hit an old build where the campaign store could not process undefined lead batches. Pull the latest `main`, run `npm install && npm run build`, and redeploy the `/dist` bundle. If the issue persists, open dev tools and confirm there are no React error #185 stacks; the null-safe store shipping in v4.3.1 should keep results rendering once Supabase returns data.

**Telemetry/Diagnostics Issues** – If MCP troubleshooting server tools (`capture_api_trace`, `compare_campaign_costs`, `predict_campaign_roi`) fail to return expected results, check OTEL collector and Supabase log connectivity. Review outputs in `dev-tools/context/session_store/diagnostics/` and validate configuration in `docs/tooling/platform-playbooks.md`.

### Ignore Hygiene & Automation (2025-10-18)

- `.vercelignore` refactored to remove redundant rules and align with `.gitignore`
- `.eslintignore` normalized with section headers mirroring `.gitignore` structure
- Validation script (`integration/infrastructure/scripts/validate-ignore-config.cjs`) checks for unwanted files after ignore changes
- Integrate validation into Husky pre-commit, Codespace startup, and Vercel build workflows
- If validation flags files, update ignore rules and rerun

#### Ignore Strategy Responsibilities

- **`.gitignore` (root)**: Source of truth for repository-wide exclusions (dependencies, env, builds, logs, archives, IDE files, secrets)
- **`.vercelignore`**: Frontend build exclusions (build outputs, logs, archives, MCP servers, test files, Supabase functions, large docs)
- **`.eslintignore`**: ESLint-specific exclusions (build outputs, logs, deployment artifacts, archives, Supabase functions)

### ✅ Completed (v4.3)

- Tier-aware background discovery pipeline (Google Places + Foursquare + Census)
- Asynchronous campaign creation with real-time job metrics
- Enrichment pipeline cost tracking (validation vs enrichment breakdown)
- Frontend alignment for tier metadata, keywords, and geography options
- Export enrichment metadata enhancements

### 🔄 In Progress

- Advanced user analytics dashboard
- API rate limiting and usage tracking
- Enhanced business category taxonomy
- Real-time campaign progress notifications

### 📋 Planned

- Team collaboration features
- Advanced export scheduling
- Custom business type definitions
- API access for enterprise users

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Documentation:** [GitHub Wiki](https://github.com/Alextorelli/ProspectPro/wiki)
- **Issues:** [GitHub Issues](https://github.com/Alextorelli/ProspectPro/issues)
- **Email:** support@prospectpro.com

---

**ProspectPro v4.3** – Tier-Aware Background Discovery with Supabase Session Enforcement
```
