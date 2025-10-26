#!/usr/bin/env bash
# Fix all .mmd diagrams: remove legacy %% tags and duplicate YAML frontmatter
# Keep only clean YAML frontmatter at top, then Mermaid code
set -euo pipefail

process_diagram() {
  local file="$1"
  echo "Processing: $file"
  
  # Create temp file
  local tmp="${file}.tmp"
  
  # Extract YAML frontmatter if it exists (between --- markers)
  local has_yaml=false
  local in_yaml=false
  local yaml_content=""
  local mermaid_content=""
  local line_num=0

  while IFS= read -r line; do
    ((line_num+=1))
    
    # Check for YAML frontmatter delimiters
    if [[ "$line" == "---" ]]; then
      if [[ $line_num -eq 1 ]] || [[ "$has_yaml" == false && -z "$mermaid_content" ]]; then
        has_yaml=true
        in_yaml=true
        yaml_content+="$line"$'\n'
        continue
      elif [[ "$in_yaml" == true ]]; then
        in_yaml=false
        yaml_content+="$line"$'\n'
        continue
      fi
    fi
    
    # Build YAML content
    if [[ "$in_yaml" == true ]]; then
      yaml_content+="$line"$'\n'
      continue
    fi
    
    # Skip legacy %% tags at the start
    if [[ "$line" =~ ^%%\ (accTitle|accDescr|domain|reciprocal|type|title|index|compliance):.*%% ]] && [[ -z "$mermaid_content" ]]; then
      continue
    fi
    
    # Skip stray markers like D--- introduced by past migrations
    if [[ "$line" =~ ^[A-Za-z]-{3}$ ]]; then
      continue
    fi

    # Drop Markdown fences; .mmd files store raw Mermaid
    if [[ "${line:0:3}" == '```' ]]; then
      continue
    fi

    # Skip duplicate %%{init:...} if we already saw one
    if [[ "$line" =~ ^%%\{init: ]] && [[ "$mermaid_content" =~ "%%{init:" ]]; then
      continue
    fi
    
    # Skip duplicate diagram type declarations (e.g., "flowchart TD" after first)
    if [[ "$line" =~ ^(flowchart|erDiagram|sequenceDiagram|classDiagram|mindmap|graph|gitGraph|gantt|pie|journey|timeline|quadrantChart|sankey|block|architecture|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment) ]] && [[ "$mermaid_content" =~ (flowchart|erDiagram|sequenceDiagram|classDiagram|mindmap|graph|gitGraph|gantt|pie|journey|timeline|quadrantChart|sankey|block|architecture|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment) ]]; then
      continue
    fi
    
    # Add to Mermaid content
    mermaid_content+="$line"$'\n'
  done < "$file"

  if [[ "$has_yaml" == true && "$in_yaml" == true ]]; then
    yaml_content+="---"$'\n'
    in_yaml=false
  fi
  
  # Write cleaned content
  {
    if [[ "$has_yaml" == true ]]; then
      echo -n "$yaml_content"
      echo ""
    fi
    echo -n "$mermaid_content"
  } > "$tmp"
  
  # Replace original
  mv "$tmp" "$file"
  echo "✓ Fixed: $file"
}

# Find and process all .mmd files
while IFS= read -r -d '' file; do
  process_diagram "$file"
done < <(find docs/app/diagrams docs/dev-tools/diagrams docs/integration/diagrams -name "*.mmd" -type f -print0 2>/dev/null)

echo "All diagrams fixed."
