#!/bin/bash
# Validates VS Code workspace configuration against ProspectPro v4.3 standards

set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ ERROR: jq is required for validation but is not installed" >&2
  exit 1
fi

echo "🔍 ProspectPro v4.3 Workspace Configuration Validation"
echo "====================================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

log_error() {
  echo -e "${RED}❌ ERROR: $1${NC}"
  ERRORS=$((ERRORS + 1))
}

log_warning() {
  echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
  WARNINGS=$((WARNINGS + 1))
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

REQUIRED_PATHS=(
  ".vscode/tasks.json"
  ".vscode/settings.json"
  ".vscode/keybindings.json"
  ".github/copilot-instructions.md"
  "config/mcp-config.json"
  "package.json"
  "supabase/functions"
  "scripts/operations/ensure-supabase-cli-session.sh"
  "scripts/testing/campaign-validation.sh"
  "scripts/testing/test-auth-patterns.sh"
  "scripts/diagnostics/edge-function-diagnostics.sh"
  "docs/technical/CODEBASE_INDEX.md"
)

echo "\n📁 Checking critical file structure..."
for path in "${REQUIRED_PATHS[@]}"; do
  if [[ -e "$path" ]]; then
    log_success "Found $path"
  else
    log_error "Missing required path: $path"
  fi
done

echo "\n🔧 Validating tasks.json..."
if [[ -f ".vscode/tasks.json" ]]; then
  if jq empty .vscode/tasks.json >/dev/null 2>&1; then
    log_success "tasks.json is valid JSON"

    REQUIRED_TASK_LABELS=(
      "Supabase: Ensure Session"
      "Supabase: Serve Local Functions"
      "Edge Functions: Deploy Function"
      "Logs: Edge Function"
      "Test: Campaign Validation"
      "Test: Auth Patterns"
      "Docs: Update All Documentation"
      "Workspace: Validate Configuration"
    )

    for label in "${REQUIRED_TASK_LABELS[@]}"; do
      if jq -e --arg label "$label" '.tasks[] | select(.label == $label)' .vscode/tasks.json >/dev/null; then
        log_success "Task registered: $label"
      else
        log_error "Missing task definition: $label"
      fi
    done

    if jq -e '.inputs[] | select(.id == "functionName")' .vscode/tasks.json >/dev/null; then
      log_success "Edge function picker input configured"
    else
      log_error "functionName input not configured"
    fi

    if jq -e '.tasks[] | select(.label == "Supabase: Link Project" and .dependsOn == "Supabase: Ensure Session")' .vscode/tasks.json >/dev/null; then
      log_success "Supabase auth dependency configured"
    else
      log_warning "Supabase link task does not depend on session guard"
    fi
  else
    log_error "tasks.json is invalid JSON"
  fi
else
  log_error "tasks.json not found"
fi

echo "\n⚙️  Validating settings.json..."
if [[ -f ".vscode/settings.json" ]]; then
  if jq empty .vscode/settings.json >/dev/null 2>&1; then
    log_success "settings.json is valid JSON"

    REQUIRED_SETTINGS=(
      "deno.enable"
      "github.copilot.chat.agent.runTasks"
      "chat.useAgentsMdFile"
      "terminal.integrated.cwd"
    )

    for setting in "${REQUIRED_SETTINGS[@]}"; do
      if jq -e --arg key "$setting" 'has($key)' .vscode/settings.json >/dev/null; then
        log_success "Setting present: $setting"
      else
        log_warning "Setting missing: $setting"
      fi
    done
  else
    log_error "settings.json is invalid JSON"
  fi
else
  log_error "settings.json not found"
fi

echo "\n🎹 Validating keybindings.json..."
if [[ -f ".vscode/keybindings.json" ]]; then
  if jq empty .vscode/keybindings.json >/dev/null 2>&1; then
    log_success "keybindings.json is valid JSON"

    declare -A REQUIRED_BINDINGS=(
      ["ctrl+shift+s"]="Supabase: Serve Local Functions"
      ["ctrl+shift+d"]="Edge Functions: Deploy Function"
      ["ctrl+shift+l"]="Logs: Edge Function"
      ["ctrl+shift+v"]="Workspace: Validate Configuration"
    )

    for key in "${!REQUIRED_BINDINGS[@]}"; do
      task="${REQUIRED_BINDINGS[$key]}"
      if jq -e --arg key "$key" --arg task "$task" '.[] | select(.key == $key and .args == $task)' .vscode/keybindings.json >/dev/null; then
        log_success "Keybinding mapped: $key → $task"
      else
        log_warning "Missing keybinding for $task"
      fi
    done
  else
    log_error "keybindings.json is invalid JSON"
  fi
else
  log_error "keybindings.json not found"
fi

echo "\n🤖 Validating MCP configuration..."
MCP_CONFIG_CANDIDATES=(
  "config/mcp-config.json"
  ".vscode/mcp-config.json"
  "mcp-config.json"
)
MCP_CONFIG_PATH=""
for candidate in "${MCP_CONFIG_CANDIDATES[@]}"; do
  if [[ -f "$candidate" ]]; then
    MCP_CONFIG_PATH="$candidate"
    break
  fi
done

if [[ -n "$MCP_CONFIG_PATH" ]]; then
  log_success "MCP configuration found: ${MCP_CONFIG_PATH}"

  if [[ -d "mcp-servers" ]]; then
    log_success "mcp-servers directory detected"
    MCP_REQUIRED_SERVERS=(
      "production-server.js"
      "development-server.js"
      "supabase-troubleshooting-server.js"
    )
    for server in "${MCP_REQUIRED_SERVERS[@]}"; do
      if [[ -f "mcp-servers/$server" ]]; then
        log_success "MCP server registered: $server"
      else
        log_warning "MCP server missing: $server"
      fi
    done
  else
    log_error "mcp-servers directory missing"
  fi
else
  log_error "MCP configuration not found (checked: ${MCP_CONFIG_CANDIDATES[*]})"
fi

echo "\n🧪 Validating Edge Functions..."
if [[ -d "supabase/functions" ]]; then
  log_success "supabase/functions directory exists"

  CRITICAL_FUNCTIONS=(
    "business-discovery-background"
    "business-discovery-optimized"
    "business-discovery-user-aware"
    "business-discovery-deduplication"
    "enrichment-orchestrator"
    "enrichment-hunter"
    "enrichment-neverbounce"
    "enrichment-business-license"
    "enrichment-cobalt"
    "enrichment-pdl"
    "campaign-export-user-aware"
    "test-new-auth"
    "test-google-places"
    "auth-diagnostics"
  )

  for fn in "${CRITICAL_FUNCTIONS[@]}"; do
    if [[ -d "supabase/functions/$fn" ]]; then
      log_success "Edge function present: $fn"
    else
      log_error "Missing edge function: $fn"
    fi
  done
else
  log_error "Supabase functions directory not found"
fi

echo "\n📜 Validating scripts..."
SCRIPT_PATHS=(
  "scripts/operations/ensure-supabase-cli-session.sh"
  "scripts/testing/campaign-validation.sh"
  "scripts/testing/test-auth-patterns.sh"
  "scripts/diagnostics/edge-function-diagnostics.sh"
)

for script in "${SCRIPT_PATHS[@]}"; do
  if [[ -f "$script" ]]; then
    if [[ -x "$script" ]]; then
      log_success "Script executable: $script"
    else
      log_warning "Script not marked executable: $script"
    fi
  else
    log_error "Missing script: $script"
  fi
done

echo "\n📦 Validating package.json scripts..."
if [[ -f "package.json" ]]; then
  REQUIRED_NPM_SCRIPTS=(
    "supabase:link"
    "supabase:db:push"
    "supabase:types"
    "supabase:db:pull"
    "deploy:critical"
    "deploy:discovery"
    "deploy:enrichment"
    "deploy:exports"
    "edge:serve"
    "edge:logs"
    "edge:logs:errors"
    "codebase:index"
    "docs:update"
    "supabase:test:db"
    "supabase:test:functions"
  )

  for script in "${REQUIRED_NPM_SCRIPTS[@]}"; do
    if jq -e --arg name "$script" '.scripts[$name]' package.json >/dev/null 2>&1; then
      log_success "npm script registered: $script"
    else
      log_error "Missing npm script: $script"
    fi
  done
fi

echo "\n📊 Validation Summary"
echo "===================="

if (( ERRORS == 0 && WARNINGS == 0 )); then
  echo -e "${GREEN}🎉 All checks passed! Workspace is aligned with ProspectPro v4.3${NC}"
  exit 0
elif (( ERRORS == 0 )); then
  echo -e "${YELLOW}⚠️  Workspace configuration valid with ${WARNINGS} warning(s)${NC}"
  exit 0
else
  echo -e "${RED}❌ Validation failed with ${ERRORS} error(s) and ${WARNINGS} warning(s)${NC}"
  exit 1
fi
