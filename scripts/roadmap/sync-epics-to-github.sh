#!/usr/bin/env bash
set -euo pipefail

# Token validation
GH_TOKEN="${GH_PROJECT_TOKEN:-${GITHUB_TOKEN:-}}"
if [[ -z "$GH_TOKEN" ]]; then
  echo "⚠️  No GitHub token found"
  echo "Set GH_PROJECT_TOKEN with project scope or run: gh auth login"
  exit 1
fi
export GH_TOKEN

# Verify authentication
if ! gh auth status &>/dev/null; then
  echo "❌ GitHub CLI not authenticated"
  echo "Run: gh auth login"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ jq is required but not installed."
  echo "Install jq (apt-get install jq) and rerun."
  exit 1
fi

ROOT=$(git rev-parse --show-toplevel)
OWNER="Alextorelli"
REPO="$OWNER/ProspectPro"
PROJECT_NUMBER=5
ISSUES_CREATED=()
PROJECT_ITEMS_ADDED=()

ensure_label() {
  local name="$1" color="$2" description="$3"
  gh label create "$name" \
    --repo "$REPO" \
    --description "$description" \
    --color "$color" \
    --force >/dev/null 2>&1 || true
}

echo "🏷️  Ensuring required labels exist..."
ensure_label "epic" "8B5CF6" "Epic-level feature or initiative"
ensure_label "roadmap" "3B82F6" "Roadmap planning item"

add_issue_to_project() {
  local issue_url="$1"
  local item_id

  item_id=$(gh project item-add \
    --owner "$OWNER" \
    --project-number "$PROJECT_NUMBER" \
    --url "$issue_url" \
    --format json \
    --jq '.id' 2>/dev/null || true)

  if [[ -z "$item_id" ]]; then
    echo "⚠️  Could not add issue to Project $PROJECT_NUMBER (check token project scope)."
    echo "   Issue remains open: $issue_url"
    return 1
  fi

  PROJECT_ITEMS_ADDED+=("$item_id")

  local status_field_id option_id
  status_field_id=$(gh project field-list \
    --owner "$OWNER" \
    --project-number "$PROJECT_NUMBER" \
    --format json \
    --jq '.fields[] | select(.name=="Status") | .id' 2>/dev/null || true)

  if [[ -n "$status_field_id" ]]; then
    option_id=$(gh project field-list \
      --owner "$OWNER" \
      --project-number "$PROJECT_NUMBER" \
      --format json \
      --jq '.fields[] | select(.name=="Status") | .options[] | select(.name=="Backlog" or .name=="Planned" or .name=="Todo" or .name=="To do") | .id' 2>/dev/null | head -n1 || true)

    if [[ -n "$option_id" ]]; then
      gh project item-edit \
        --id "$item_id" \
        --field-id "$status_field_id" \
        --single-select-option-id "$option_id" >/dev/null 2>&1 || true
    fi
  fi

  return 0
}

echo "🔍 Scanning epics in docs/roadmap/epics..."

while IFS= read -r file; do
  title=$(sed -n 's/^# //p' "$file" | head -1)

  if [[ -z "$title" ]]; then
    echo "⚠️  Skipping $(basename "$file") (missing title)."
    continue
  fi

  existing=$(gh issue list \
    --repo "$REPO" \
    --search "\"$title\" in:title" \
    --json number,url \
    --jq '.[0]' 2>/dev/null || echo "")

  if [[ -n "${existing:-}" && "$existing" != "null" ]]; then
    issue_number=$(echo "$existing" | jq -r '.number // empty' 2>/dev/null || echo "")
    issue_url=$(echo "$existing" | jq -r '.url // empty' 2>/dev/null || echo "")
    echo "⏭️  Skipping '$title' (issue #$issue_number exists)"
    if [[ -n "$issue_url" ]]; then
      add_issue_to_project "$issue_url" && echo "   ↳ Linked existing #$issue_number to Project $PROJECT_NUMBER"
    fi
    continue
  fi

  echo "📝 Creating issue: $title"

  issue_url=$(gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body-file "$file" \
    --label epic \
    --label roadmap \
    --json url \
    --jq '.url' 2>/dev/null || echo "")

  if [[ -z "$issue_url" ]]; then
    echo "❌ Issue creation failed for '$title'"
    continue
  fi

  issue_number=$(echo "$issue_url" | grep -oE '[0-9]+$' || echo "")

  if [[ -n "$issue_number" ]]; then
    echo "✅ Created issue #$issue_number"
    ISSUES_CREATED+=("$issue_number")
  fi

  add_issue_to_project "$issue_url" && echo "   ↳ Linked #$issue_number to Project $PROJECT_NUMBER"

  sleep 0.5
done < <(find "$ROOT/docs/roadmap/epics" -type f -name '*.md')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Created ${#ISSUES_CREATED[@]} new issue(s)"
echo "📌 Added ${#PROJECT_ITEMS_ADDED[@]} item(s) to Project $PROJECT_NUMBER"
echo "🔗 Project: https://github.com/users/$OWNER/projects/$PROJECT_NUMBER"

if [[ ${#ISSUES_CREATED[@]} -gt 0 ]]; then
  echo ""
  echo "Issues created:"
  for num in "${ISSUES_CREATED[@]}"; do
    echo " - https://github.com/$REPO/issues/$num"
  done
fi
