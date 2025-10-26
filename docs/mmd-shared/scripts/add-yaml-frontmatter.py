#!/usr/bin/env python3
"""
Add YAML frontmatter to all .mmd diagrams that are missing it.
Extract metadata from legacy %% tags if present, or use sensible defaults.
"""
import os
import re
from pathlib import Path

DIAGRAM_ROOTS = [
    "docs/app/diagrams",
    "docs/dev-tools/diagrams",
    "docs/integration/diagrams",
]

DIAGRAM_TYPE_PATTERN = re.compile(r"^(flowchart|erDiagram|sequenceDiagram|classDiagram|mindmap|graph|gitGraph|gantt|pie|journey|timeline|quadrantChart|sankey|block|architecture|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b")
CONFIG_REFERENCE = Path("docs/mmd-shared/config/index.md").resolve()

def extract_legacy_metadata(lines):
    """Extract metadata from legacy %% tags."""
    metadata = {
        "accTitle": "",
        "accDescr": "",
        "domain": "app-source",
        "type": "flowchart",
        "title": "",
        "index": None,
    }
    
    for line in lines:
        stripped = line.strip()
        if match := re.match(r"^%%\s+accTitle:\s*(.+?)\s*%%\s*$", stripped):
            metadata["accTitle"] = match.group(1).strip()
        elif match := re.match(r"^%%\s+accDescr:\s*(.+?)\s*%%\s*$", stripped):
            metadata["accDescr"] = match.group(1).strip()
        elif match := re.match(r"^%%\s+domain:\s*(.+?)\s*%%\s*$", stripped):
            metadata["domain"] = match.group(1).strip()
        elif match := re.match(r"^%%\s+type:\s*(.+?)\s*%%\s*$", stripped):
            metadata["type"] = match.group(1).strip()
        elif match := re.match(r"^%%\s+title:\s*(.+?)\s*%%\s*$", stripped):
            metadata["title"] = match.group(1).strip()
        elif match := re.match(r"^%%\s+index:\s*(.+?)\s*%%\s*$", stripped):
            metadata["index"] = match.group(1).strip()
    
    return metadata

def detect_diagram_type(lines):
    """Detect diagram type from content."""
    for line in lines:
        if match := DIAGRAM_TYPE_PATTERN.match(line.strip()):
            return match.group(1)
    return "flowchart"

def process_diagram(file_path):
    """Add YAML frontmatter to a diagram file if missing."""
    print(f"Processing: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Check if YAML frontmatter already exists
    if lines and lines[0].strip() == "---":
        print(f"  ✓ Already has YAML frontmatter")
        return
    
    # Extract metadata from legacy tags or use defaults
    metadata = extract_legacy_metadata(lines)
    detected_type = detect_diagram_type(lines)
    
    if not metadata["type"] or metadata["type"] == "flowchart":
        metadata["type"] = detected_type
    
    if not metadata["title"]:
        # Use filename as title
        metadata["title"] = file_path.stem.replace("-", " ").replace("_", " ").title()
    
    if not metadata["accTitle"]:
        metadata["accTitle"] = metadata["title"]
    
    if not metadata["accDescr"]:
        metadata["accDescr"] = f"TODO: Add description for {metadata['title']}"
    
    # Determine domain from path
    if "dev-tools" in str(file_path):
        metadata["domain"] = "dev-tools"
    elif "integration" in str(file_path):
        metadata["domain"] = "integration"
    else:
        metadata["domain"] = "app-source"
    
    # Build YAML frontmatter
    if not metadata["index"]:
        rel_index = os.path.relpath(CONFIG_REFERENCE, file_path.parent.resolve())
        metadata["index"] = rel_index.replace(os.sep, "/")

    yaml_frontmatter = [
        "---\n",
        f"accTitle: {metadata['accTitle']}\n",
        f"accDescr: {metadata['accDescr']}\n",
        f"domain: {metadata['domain']}\n",
        f"type: {metadata['type']}\n",
        f"title: {metadata['title']}\n",
        f"index: {metadata['index']}\n",
        "---\n",
        "\n"
    ]
    
    # Remove legacy %% tags and keep only Mermaid code
    clean_lines = []
    seen_init = False
    for line in lines:
        stripped = line.strip()
        # Skip legacy tags
        if re.match(r"^%%\s+(accTitle|accDescr|domain|reciprocal|type|title|index|compliance):", stripped):
            continue
        # Skip stray markers like D--- created by previous migrations
        if re.match(r"^[A-Za-z]-{3}$", stripped):
            continue
        # Drop Markdown fences; diagrams live as raw Mermaid
        if stripped.startswith("```"):
            continue
        # Keep first %%{init:...}
        if re.match(r"^%%\{init:", stripped):
            if not seen_init:
                seen_init = True
                clean_lines.append(line)
            continue
        # Keep everything else
        clean_lines.append(line)
    
    # Write file with YAML frontmatter
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(yaml_frontmatter)
        f.writelines(clean_lines)
    
    print(f"  ✓ Added YAML frontmatter")

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
    
    print(f"\nProcessed {count} diagram files.")

if __name__ == "__main__":
    main()
