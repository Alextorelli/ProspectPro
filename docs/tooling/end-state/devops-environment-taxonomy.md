# DevOps Environment Taxonomy Research Notes (Round 2 Prep)

Source material captured for follow-up synthesis and alignment work. Content reflects modern DevOps environment boundaries, AI agent routing, and environment-aware MCP clustering proposals. Reference URLs retained for rapid validation.

---

## Diagram Source of Truth & Revision Catalog

- Treat this document as the canonical specification for environment-aware routing across Option A participants, MCP clusters, and automation hooks.
- When updating flows, edit this markdown first, then regenerate dependent diagrams via `npm run docs:patch:diagrams --source docs/tooling/end-state` followed by `npm run docs:prepare`.
- Generated Mermaid diagrams (all in `docs/tooling/end-state/`) are derived from the narratives and tables below:
  - `agent-mode-flow.mmd` – environment → agent mode → Option A participant mapping
  - `agent-environment-map-state.mmd` – environment detection → MCP cluster selection → participant activation
  - `environment-mcp-cluster.mmd` – cluster inventory aligned with Option A tooling
  - `agent-coordination-flow.mmd` and `workflow-architecture-c4.mmd` – promotion pipeline feedback loops
    - Repository-wide ER view (`docs/tooling/end-state/dev-tool-suite-ER.mmd`) is the source-of-truth for participant/automation relationships
- Document revisions that impact diagrams must be noted in `docs/tooling/end-state/tools-suite-migration-plan.md` (Phase 2/3 checkpoints) to keep the migration ledger synchronized.

---

## Modern DevOps Environment Boundaries

### Development Environment Taxonomy

| Environment     | Purpose                                   | Boundaries                                    | Access Control  |
| :-------------- | :---------------------------------------- | :-------------------------------------------- | :-------------- |
| **Sandbox**     | Individual dev experimentation            | Local/isolated, no shared state               | Developer-owned |
| **Development** | Integration testing, shared dev state     | Shared infrastructure, relaxed security       | Team access     |
| **Testing/QA**  | Automated testing, performance validation | Production-like data, controlled access       | QA + Dev teams  |
| **Staging**     | Production replica for final validation   | Identical to prod infrastructure              | Limited access  |
| **Production**  | Live user traffic                         | Strict security, monitoring, SLA requirements | Ops team only   |

### Key Functional Differences

- **Data Separation**: Development uses synthetic/anonymized data; Production uses real user data.
- **Security Posture**: Dev environments have relaxed controls; Production has strict access controls and compliance.
- **Monitoring Depth**: Development focuses on debugging; Production emphasizes observability and alerting.
- **Change Velocity**: Development allows rapid iteration; Production requires change management processes.
- **Resource Scaling**: Development uses minimal resources; Production auto-scales based on demand.

---

## Optimized AI Agent DevOps Taxonomy

### Environment-Aware Agent Modes

```mermaid
%%{init: {'theme': 'dark', 'layout': 'dagre'}}%%
flowchart TD
    subgraph Environment
        DEV[Development]
        TEST[Test/QA]
        STAGE[Staging]
        PROD[Production]
        INCIDENT[Incident Response]
    end

    subgraph Copilot_Agent_Modes
        DEBUG_MODE[debug]
        FEATURE_MODE[feature]
        SUPPORT_MODE[support]
        OPTIMIZE_MODE[optimize]
        SECURITY_MODE[security]
    end

    subgraph Terminal_Participants
        ux_participant[ux]
        platform_participant[platform]
        devops_participant[devops]
        secops_participant[secops]
        integrations_participant[integrations]
    end

    subgraph Functions_Primitives
        DETECT[Detect]
        DIAGNOSE[Diagnose]
        REMEDIATE[Remediate]
        VALIDATE[Validate]
        ORCHESTRATE[Orchestrate]
        REPORT[Report]
    end

    DEV --> DEBUG_MODE
    TEST --> FEATURE_MODE
    STAGE --> SUPPORT_MODE
    PROD --> OPTIMIZE_MODE
    INCIDENT --> SECURITY_MODE

    DEBUG_MODE --> platform_participant
    DEBUG_MODE --> ux_participant
    FEATURE_MODE --> ux_participant
    FEATURE_MODE --> integrations_participant
    SUPPORT_MODE --> platform_participant
    SUPPORT_MODE --> secops_participant
    OPTIMIZE_MODE --> devops_participant
    OPTIMIZE_MODE --> secops_participant
    SECURITY_MODE --> secops_participant
    SECURITY_MODE --> devops_participant

    ux_participant --> VALIDATE
    platform_participant --> DIAGNOSE
    platform_participant --> REPORT
    devops_participant --> ORCHESTRATE
    secops_participant --> DETECT
    secops_participant --> REMEDIATE
    integrations_participant --> ORCHESTRATE
    integrations_participant --> REPORT
```

### Layer-Aligned Participant Mapping (Option A)

Source of record: `docs/tooling/staging/chat-participants-taxonomy.md` (promote to `docs/tooling/end-state/` after approval).

| Participant Tag            | Layers Covered                                                 | Key Activities                                                                    | Agent Pairings                    | MCP / Automation Hooks                                                           |
| -------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------- |
| `@ux`                      | Frontend experience & design                                   | React UI audits, accessibility, component hygiene, DevTools telemetry             | `@deliver`, `@debug`              | `react-devtools`, design checklist                                               |
| `@platform`                | API services, database, integrations, enrichment quality       | Endpoint diagnostics, schema/migration review, enrichment data QA, reporting KPIs | `@debug`, `@deliver`, `@support`  | `supabase-dev`, `integration-hub`, Postgres validators, `ci_cd_validation_suite` |
| `@devops`                  | CI/CD, infrastructure, container orchestration                 | Pipeline tuning, Docker/IaC updates, environment routing, diagram guardrails      | `@deliver`, `@optimize`           | `docs:patch:diagrams`, Docker tasks, GitHub workflow guard                       |
| `@secops`                  | Security posture, compliance, observability, incident response | Risk triage, alert tuning, production telemetry, rollback playbooks               | `@support`, `@debug`, `@optimize` | `security-scan`, observability MCP, `context-snapshot.sh`, rollback scripts      |
| `@integrations` (optional) | External partner APIs, payments, webhook orchestration         | Contract validation, vendor health checks, future Stripe workflows                | `@deliver`, `@research`           | Integration MCP cluster, Stripe hooks (planned), CRM connectors                  |

### Intelligent DevOps Workflow Architecture

```mermaid
%%{init: {'theme': 'dark'}}%%
C4Context
    title AI-Driven DevOps Workflow Architecture

    Person(dev, "Developer", "Writes code, triggers AI workflows")

    System_Boundary(vscode, "VS Code + AI Ecosystem") {
        System(copilot, "GitHub Copilot", "Code generation and chat")
        System(mcp, "MCP Servers", "Environment-aware tools")
        System(agents, "Chat Participants", "Specialized AI agents")
    }

    System_Boundary(environments, "Environment Pipeline") {
        System(dev_env, "Development", "Local dev plus shared dev infra")
        System(test_env, "Testing", "Automated QA validation")
        System(stage_env, "Staging", "Production replica")
        System(prod_env, "Production", "Live user traffic")
    }

    System_Boundary(automation, "Automation Layer") {
        System(cicd, "CI/CD Pipeline", "GitOps deployment")
        System(monitoring, "Observability", "Metrics, logs, traces")
        System(iac, "Infrastructure as Code", "Environment provisioning")
    }

    Rel(dev, copilot, "Writes code with AI assistance")
    Rel(copilot, agents, "Triggers specialized agents")
    Rel(agents, mcp, "Uses environment-aware tools")
    Rel(mcp, dev_env, "Development operations")
    Rel(dev_env, cicd, "Automated promotion")
    Rel(cicd, test_env, "Deploy and test")
    Rel(test_env, stage_env, "Validated promotion")
    Rel(stage_env, prod_env, "Production deployment")
    Rel(monitoring, agents, "Feedback loop")
```

### Enhanced Agent-to-Environment Mapping

```mermaid
%%{init: {'theme': 'dark'}}%%
stateDiagram-v2
    [*] --> EnvironmentDetection

    state EnvironmentDetection {
        [*] --> DetectContext
    DetectContext --> LocalDev : git branch = dev/*
    DetectContext --> SharedDev : git branch = develop
    DetectContext --> Testing : git branch = test/*
    DetectContext --> Staging : git branch = staging
    DetectContext --> Production : git branch = main
    DetectContext --> Incident : alert triggered
    }

    state LocalDev {
        [*] --> ActivateDevAgents
        ActivateDevAgents --> DebugAgent
        ActivateDevAgents --> ResearchAgent
        DebugAgent --> DevMCPCluster
        ResearchAgent --> DevMCPCluster
    }

    state SharedDev {
        [*] --> ActivateIntegrationAgents
        ActivateIntegrationAgents --> DeliverAgent
        DeliverAgent --> IntegrationMCPCluster
    }

    state Testing {
        [*] --> ActivateQAAgents
        ActivateQAAgents --> ValidateAgent
        ValidateAgent --> TestingMCPCluster
    }

    state Staging {
        [*] --> ActivateStagingAgents
        ActivateStagingAgents --> OptimizeAgent
        OptimizeAgent --> StagingMCPCluster
    }

    state Production {
        [*] --> ActivateProdAgents
        ActivateProdAgents --> SupportAgent
        SupportAgent --> ProductionMCPCluster
    }

    state Incident {
        [*] --> ActivateIncidentAgents
        ActivateIncidentAgents --> SecurityAgent
        ActivateIncidentAgents --> SupportAgent
        SecurityAgent --> IncidentMCPCluster
        SupportAgent --> IncidentMCPCluster
    }
```

---

## Optimized MCP Server Architecture

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart TD
    subgraph env_clusters ["Environment-Specific MCP Clusters"]
        subgraph dev_cluster ["Development Cluster"]
            D1[chrome-devtools-local]
            D2[github-dev-ops]
            D3[supabase-dev]
            D4[postgres-local]
        end
        subgraph test_cluster ["Testing Cluster"]
            T1[integration-testing]
            T2[performance-profiling]
            T3[quality-gates]
            T4[test-data-management]
        end
        subgraph stage_cluster ["Staging Cluster"]
            S1[supabase-staging]
            S2[observability-staging]
            S3[deployment-validation]
            S4[cost-optimization]
        end
        subgraph prod_cluster ["Production Cluster"]
            P1[supabase-production]
            P2[monitoring-alerts]
            P3[incident-response]
            P4[security-scanning]
        end
    end
    subgraph cross_tools ["Cross-Environment Tools"]
        X1[github-cicd]
        X2[infrastructure-as-code]
        X3[secrets-management]
    end
    ENV_ROUTER[Environment Router]
    ENV_ROUTER --> D1
    ENV_ROUTER --> T1
    ENV_ROUTER --> S1
    ENV_ROUTER --> P1
    ENV_ROUTER --> X1
```

### Enhanced Agent Coordination Flow

```mermaid
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
    participant DEV as Developer
    participant ROUTER as Environment Router
    participant AGENT as Selected Agent
    participant MCP as Environment MCP Cluster
    participant CICD as CI/CD Pipeline
    participant MONITOR as Monitoring

    DEV->>ROUTER: @agent command + context
    ROUTER->>ROUTER: Detect environment (git branch, deployment stage)
    ROUTER->>AGENT: Activate environment-aware agent

    alt Development Environment
        AGENT->>MCP: Use development MCP cluster
        MCP-->>AGENT: Local debugging tools
    else Staging Environment
        AGENT->>MCP: Use staging MCP cluster
        MCP-->>AGENT: Performance optimization tools
    else Production Environment
        AGENT->>MCP: Use production MCP cluster
        MCP-->>AGENT: Monitoring & incident tools
    end

    AGENT->>CICD: Trigger environment-specific pipeline
    CICD->>MONITOR: Report deployment metrics
    MONITOR-->>AGENT: Provide feedback for optimization
    AGENT-->>DEV: Environment-aware response
```

---

## Key Improvement Themes

1. **Environment-Aware Routing**: Agents automatically select environment-specific tools based on branch/stage.
2. **Security Boundaries**: Production MCP servers separated from development endpoints; access tightly controlled.
3. **GitOps Integration**: Environment-specific Git branches with automated promotion gates.
4. **Observability Feedback Loop**: Monitoring signals inform agent decisions and close the loop after deployments.
5. **Incident Response Mode**: Dedicated pathways for security/support agents during alerts.

---

## Reference Index

1. https://www.statsig.com/perspectives/dev-vs-staging-vs-prod
2. https://docs.aws.amazon.com/prescriptive-guidance/latest/choosing-git-branch-approach/understanding-the-devops-environments.html
3. https://octopus.com/devops/gitops/gitops-environments/
4. https://www.datadoghq.com/blog/gitops-principles-and-components/
5. https://octopus.com/devops/devops-approach/
6. https://www.linkedin.com/pulse/why-one-environment-never-enough-modern-devops-alexandr-zaichenko-07qbe
7. https://www.reddit.com/r/azuredevops/comments/1fp41os/help_me_to_understand_environments_please/
8. https://www.firefly.ai/academy/what-is-infrastructure-as-code
9. https://azure.microsoft.com/en-us/resources/cloud-computing-dictionary/what-is-devops
10. https://arxiv.org/html/2507.05100v1
11. https://dodcio.defense.gov/Portals/0/Documents/Library/DoD%20Enterprise%20DevSecOps%20Fundamentals%20v2.5.pdf
12. https://codefresh.io/blog/stop-using-branches-deploying-different-gitops-environments/
13. https://www.chkk.io/blog/iac-repo-patterns-in-the-wild
14. https://hhhypergrowth.com/what-is-the-modern-devops-workflow/
15. https://www.redhat.com/en/blog/gitops-approval-application-deployment-environment
16. https://www.sciencedirect.com/science/article/pii/S0164121223003035
17. https://www.qovery.com/blog/devops-automation
18. https://www.reddit.com/r/devops/comments/msrlhe/how_do_you_manage_multiple_environments_with/
19. https://www.chrisparnin.me/pdf/GangOfEight.pdf
20. https://www.reddit.com/r/devops/comments/1fm542y/cicd_strategies_with_environment_specific/
