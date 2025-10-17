#!/usr/bin/env bash
set -euo pipefail

# Configuration - edit if needed
OWNER="Alextorelli"
REPO="ProspectPro"
PROJECT_NUMBER=2   # from URL: /users/Alextorelli/projects/2
ASSIGNEE=""        # optional default assignee, e.g. "Alextorelli"
DRY_RUN=false      # set to true to only show actions

# Helper functions
require() {
  command -v "$1" >/dev/null 2>&1 || { echo "Required command '$1' not found. Please install and try again."; exit 1; }
}

gh_check_repo_features() {
  echo "Checking repository features for $OWNER/$REPO..."
  repo_json=$(gh api repos/"$OWNER"/"$REPO" --jq '.')
  has_issues=$(echo "$repo_json" | jq -r '.has_issues')
  if [[ "$has_issues" != "true" ]]; then
    echo "ERROR: Issues are disabled for $OWNER/$REPO. Enable Issues in the repo settings and re-run."
    exit 1
  fi
}

gh_create_label() {
  local name="$1"
  local color="$2"
  local description="$3"
  if $DRY_RUN; then
    echo "[DRY RUN] create label: $name"
    return
  fi
  # create or update label (gh label create fails if exists, so try create then patch)
  if gh label list --repo "$OWNER/$REPO" --limit 500 --json name | jq -r '.[].name' | grep -Fxq "$name"; then
    gh label edit "$name" --repo "$OWNER/$REPO" --color "$color" --description "$description" >/dev/null
    echo "Updated label: $name"
  else
    gh label create "$name" --repo "$OWNER/$REPO" --color "$color" --description "$description" >/dev/null
    echo "Created label: $name"
  fi
}

create_issue_and_add_to_project() {
  local title="$1"
  local body="$2"
  local labels_csv="$3" # comma-separated labels
  local assignees_arg=()
  if [[ -n "$ASSIGNEE" ]]; then
    assignees_arg=(--assignee "$ASSIGNEE")
  fi

  echo "Creating issue: $title"
  if $DRY_RUN; then
    echo "[DRY RUN] Issue body: $body"
    # mock issue number / node_id
    echo "DRYRUN-ISSUE"
    return
  fi

  # convert comma-separated labels into repeated --label flags
  IFS=',' read -r -a label_array <<< "$labels_csv"
  label_args=()
  for l in "${label_array[@]}"; do
    l_trimmed=$(echo "$l" | sed 's/^ *//;s/ *$//')
    if [[ -n "$l_trimmed" ]]; then
      label_args+=(--label "$l_trimmed")
    fi
  done

  # create issue and return number & node_id
  create_out=$(gh issue create --repo "$OWNER/$REPO" --title "$title" --body "$body" "${label_args[@]}" "${assignees_arg[@]}" --json number,node_id,url)
  number=$(echo "$create_out" | jq -r '.number')
  node_id=$(echo "$create_out" | jq -r '.node_id')
  url=$(echo "$create_out" | jq -r '.url')
  echo "Created issue #$number -> $url"

  # add to Projects v2
  add_issue_to_project_v2 "$node_id" "$url"
  echo "$url"
}

get_project_v2_id() {
  echo "Looking up Project V2 id for user $OWNER project number $PROJECT_NUMBER..."
  query='
  query($login:String!,$num:Int!){
    user(login:$login){
      projectV2(number:$num){
        id
        title
      }
    }
  }'
  resp=$(gh api graphql -f query="$query" -f login="$OWNER" -F num="$PROJECT_NUMBER")
  projId=$(echo "$resp" | jq -r '.data.user.projectV2.id // empty')
  projTitle=$(echo "$resp" | jq -r '.data.user.projectV2.title // empty')
  if [[ -z "$projId" ]]; then
    echo "ERROR: Could not find project number $PROJECT_NUMBER for user $OWNER. Confirm the project URL and number."
    exit 1
  fi
  echo "Found project: $projTitle (id: $projId)"
  echo "$projId"
}

add_issue_to_project_v2() {
  local issue_node_id="$1"
  local issue_url="$2"
  if $DRY_RUN; then
    echo "[DRY RUN] Would add $issue_url to project"
    return
  fi
  if [[ -z "${PROJECT_V2_ID:-}" ]]; then
    echo "ERROR: PROJECT_V2_ID not set"
    exit 1
  fi
  mutation='
  mutation($projectId:ID!,$contentId:ID!){
    addProjectV2ItemByContent(input:{projectId:$projectId,contentId:$contentId}){
      item{
        id
      }
    }
  }'
  out=$(gh api graphql -f query="$mutation" -f projectId="$PROJECT_V2_ID" -f contentId="$issue_node_id")
  item_id=$(echo "$out" | jq -r '.data.addProjectV2ItemByContent.item.id // empty')
  if [[ -z "$item_id" ]]; then
    echo "WARNING: Could not add issue to project (it might already be added). GitHub response:"
    echo "$out" | jq -c .
  else
    echo "Added to project as item $item_id"
  fi
}

main() {
  require gh
  require jq

  # Prefer GH_PROJECT_TOKEN (project-scoped PAT) over environment tokens
  if [[ -n "${GH_PROJECT_TOKEN:-}" ]]; then
    export GITHUB_TOKEN="$GH_PROJECT_TOKEN"
    echo "Using GH_PROJECT_TOKEN for GitHub API access"
  elif [[ -n "${GITHUB_TOKEN:-}" ]]; then
    echo "Using GITHUB_TOKEN from environment"
  else
    echo "ERROR: No GitHub token found."
    echo "Set GH_PROJECT_TOKEN with project scope:"
    echo "  export GH_PROJECT_TOKEN=github_pat_..."
    echo ""
    echo "Generate at: https://github.com/settings/tokens?type=beta"
    echo "Required scopes: repo, project (account permissions)"
    exit 1
  fi

  # Verify token has project access (best-effort check)
  if ! gh auth status 2>&1 | grep -q "Logged in"; then
    echo "ERROR: GitHub CLI authentication failed"
    echo "Run: gh auth login --with-token <<< \"\$GH_PROJECT_TOKEN\""
    exit 1
  fi

  gh_check_repo_features

  # Create labels (categories + priority + impact)
  echo "Creating roadmap labels..."
  gh_create_label "cat:Core Platform & Infrastructure" "0e8a16" "Category: Core platform and infra"
  gh_create_label "cat:Revenue & Billing Optimization" "b60205" "Category: Revenue and billing"
  gh_create_label "cat:Data Source Integrations" "0366d6" "Category: Data source integrations"
  gh_create_label "cat:User Experience & Interface" "6f42c1" "Category: UI/UX"
  gh_create_label "cat:Compliance & Specialized Markets" "d93f0b" "Category: Compliance and verticals"
  gh_create_label "cat:Automation & Scalability" "fbca04" "Category: Automation & scaling"

  gh_create_label "priority:Critical" "b60205" "Priority: Critical"
  gh_create_label "priority:High" "d93f0b" "Priority: High"
  gh_create_label "priority:Medium" "fbca04" "Priority: Medium"
  gh_create_label "priority:Low" "0e8a16" "Priority: Low"

  gh_create_label "impact:High Revenue" "5319e7" "Business Impact: High Revenue"
  gh_create_label "impact:Cost Savings" "1d76db" "Business Impact: Cost Savings"
  gh_create_label "impact:Growth Driver" "008672" "Business Impact: Growth Driver"
  gh_create_label "impact:Risk Mitigation" "bfe5bf" "Business Impact: Risk Mitigation"
  gh_create_label "impact:Customer Experience" "fef2c0" "Business Impact: Customer Experience"

  # Find project id
  PROJECT_V2_ID=$(get_project_v2_id)

  # Create critical issues
  echo "Creating critical issues..."

  title="🔥 CRITICAL: Stripe Usage-Based Billing Implementation"
  body=$(cat <<'EOF'
## Problem Statement
Current pricing model operates at a loss on Base ($0.30) and Professional ($0.90) tiers.

## Solution  
Implement Stripe usage-based billing with proper cost tracking and tiered pricing.

## Acceptance Criteria
- [ ] Set up Stripe usage meters for lead processing
- [ ] Configure tiered pricing: $1.50-7.50 per lead based on discovery level
- [ ] Implement real-time usage tracking in application
- [ ] Create customer migration strategy  
- [ ] Test billing workflow end-to-end

## Business Impact
- Fix loss-making pricing model
- Target 70%+ gross margin per lead
- Enable sustainable scaling

## Technical Requirements
- Stripe API integration
- Usage event tracking  
- Customer portal updates
EOF
)
  labels="cat:Revenue & Billing Optimization,priority:Critical,impact:High Revenue"
  issue1_url=$(create_issue_and_add_to_project "$title" "$body" "$labels")

  title="🚨 Cost Monitoring & Rate Limiting Dashboard"
  body=$(cat <<'EOF'
## Problem Statement
No visibility into API costs leading to potential budget overruns.

## Solution
Build comprehensive cost monitoring with automated circuit breakers.

## Acceptance Criteria  
- [ ] Real-time API usage tracking across Hunter, Apollo, Google APIs
- [ ] Campaign-level budget controls and alerts
- [ ] Emergency circuit breakers at 80% and 100% budget
- [ ] Usage analytics dashboard for admins
- [ ] Cost-per-lead calculations and trends

## Business Impact
- Prevent infrastructure cost spirals
- Enable data-driven pricing decisions
- Provide customer usage transparency  

## Technical Requirements
- Supabase analytics integration
- Real-time usage meters
- Alert system implementation
EOF
)
  labels="cat:Core Platform & Infrastructure,priority:High,impact:Risk Mitigation"
  issue2_url=$(create_issue_and_add_to_project "$title" "$body" "$labels")

  title="💎 FINRA API Integration (Financial Services Premium Tier)"
  body=$(cat <<'EOF'
## Problem Statement
Missing high-value specialized market for financial services verification.

## Solution
Integrate FINRA APIs for premium financial advisor and firm verification.

## Acceptance Criteria
- [ ] FINRA OAuth 2.0 authentication implementation
- [ ] Individual advisor verification API ($25/lookup)
- [ ] Pre-employment screening workflow ($75/lookup)
- [ ] Firm due diligence packages ($200/firm)  
- [ ] Compliance-grade reporting and risk scoring
- [ ] Integration with existing lead enrichment pipeline

## Business Impact
- $25K-150K monthly revenue potential at scale
- 25,000%+ markup on FINRA API costs
- Unique competitive advantage in financial services

## Technical Requirements
- FINRA API credentials and compliance
- OAuth 2.0 flow implementation
- Premium tier UI/UX
- Financial services compliance features
EOF
)
  labels="cat:Compliance & Specialized Markets,priority:High,impact:High Revenue"
  issue3_url=$(create_issue_and_add_to_project "$title" "$body" "$labels")

  echo "Done. Created issues:"
  echo "$issue1_url"
  echo "$issue2_url"
  echo "$issue3_url"
  echo ""
  echo "Notes:"
  echo "- Custom Project fields (Category, Priority, Quarter, Business Impact, Estimate, Timeline) are not set via this script. You can create them in the Project UI or I can provide a follow-up script to add / configure Project v2 fields programmatically."
  echo "- If you want more issues seeded, extend the script with more create_issue_and_add_to_project calls."
}

main "$@"
