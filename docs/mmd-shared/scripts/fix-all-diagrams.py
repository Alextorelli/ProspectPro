#!/usr/bin/env python3
"""
Fix all .mmd diagrams: remove legacy %% tags, duplicate YAML frontmatter, and duplicate diagram declarations.
Keep only clean YAML frontmatter at top, then Mermaid code.
"""
import re
from pathlib import Path

DIAGRAM_ROOTS = [
    "docs/app/diagrams",
    "docs/dev-tools/diagrams",
    "docs/integration/diagrams",
    "docs/diagrams",
]

LEGACY_TAG_PATTERN = re.compile(r"^%%\s+(accTitle|accDescr|domain|reciprocal|type|title|index|compliance):\s*.*\s*%%\s*$")
INIT_PATTERN = re.compile(r"^%%\{init:")
DIAGRAM_TYPE_PATTERN = re.compile(r"^(flowchart|erDiagram|sequenceDiagram|classDiagram|mindmap|graph|gitGraph|gantt|pie|journey|timeline|quadrantChart|sankey|block|architecture|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b")

def process_diagram(file_path):
    """Clean a single diagram file."""
    print(f"Processing: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Extract YAML frontmatter
    yaml_lines = []
    mermaid_lines = []
    in_yaml = False
    yaml_closed = False
    seen_init = False
    seen_diagram_type = False
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # YAML frontmatter detection
        if stripped == "---":
            if i == 0 or (not yaml_closed and not mermaid_lines):
                in_yaml = not in_yaml
                if in_yaml:
                    yaml_lines.append(line)
                else:
                    yaml_lines.append(line)
                    yaml_closed = True
                continue
        
        # Inside YAML frontmatter
        if in_yaml:
            yaml_lines.append(line)
            continue
        
        # Skip legacy %% tags before Mermaid content
        if not mermaid_lines and LEGACY_TAG_PATTERN.match(stripped):
            continue
        
        # Skip duplicate %%{init:...}
        if INIT_PATTERN.match(stripped):
            if seen_init:
                continue
            seen_init = True
        
        # Skip duplicate diagram type declarations
        if DIAGRAM_TYPE_PATTERN.match(stripped):
            if seen_diagram_type:
                continue
            seen_diagram_type = True
        
        # Add to Mermaid content
        mermaid_lines.append(line)
    
    # Write cleaned content
    with open(file_path, 'w', encoding='utf-8') as f:
        if yaml_lines:
            f.writelines(yaml_lines)
            if mermaid_lines and not yaml_lines[-1].endswith('\n\n'):
                f.write('\n')
        f.writelines(mermaid_lines)
    
    print(f"✓ Fixed: {file_path}")

def main():
    """Process all .mmd files."""
    count = 0
    for root in DIAGRAM_ROOTS:
        root_path = Path(root)
        if not root_path.exists():
            continue
        for file_path in root_path.rglob("*.mmd"):
            process_diagram(file_path)
            count += 1
    
    print(f"\nFixed {count} diagram files.")

if __name__ == "__main__":
    main()
