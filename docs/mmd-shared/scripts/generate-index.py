#!/usr/bin/env python3
"""
Generate the Mermaid diagram index from actual .mmd files in the repository.
Extracts metadata from YAML frontmatter and creates a comprehensive index.
"""
import re
from pathlib import Path
from typing import Dict, List, Tuple
from datetime import datetime

DIAGRAM_ROOTS = [
    "docs/app/diagrams",
    "docs/dev-tools/diagrams",
    "docs/integration/diagrams",
    "docs/diagrams",
]

def extract_metadata(file_path: Path) -> Dict[str, str]:
    """Extract metadata from YAML frontmatter."""
    metadata = {
        "title": file_path.stem.replace("-", " ").replace("_", " ").title(),
        "type": "flowchart",
        "domain": "unknown"
    }
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract YAML frontmatter
        if content.startswith('---'):
            end_idx = content.find('---', 3)
            if end_idx != -1:
                yaml_content = content[3:end_idx]
                
                # Parse YAML fields
                for line in yaml_content.split('\n'):
                    line = line.strip()
                    if ':' in line:
                        key, value = line.split(':', 1)
                        key = key.strip()
                        value = value.strip()
                        if key in metadata:
                            metadata[key] = value
    except Exception as e:
        print(f"Warning: Could not extract metadata from {file_path}: {e}")
    
    return metadata

def categorize_diagrams() -> Dict[str, List[Tuple[Path, Dict[str, str]]]]:
    """Categorize all diagrams by their location."""
    categories = {
        "app": [],
        "dev-tools": [],
        "integration": [],
        "legacy": []
    }
    
    for root in DIAGRAM_ROOTS:
        root_path = Path(root)
        if not root_path.exists():
            continue
        
        for file_path in sorted(root_path.rglob("*.mmd")):
            metadata = extract_metadata(file_path)
            
            # Categorize based on path
            path_str = str(file_path)
            if "docs/app/diagrams" in path_str:
                categories["app"].append((file_path, metadata))
            elif "docs/dev-tools/diagrams" in path_str:
                categories["dev-tools"].append((file_path, metadata))
            elif "docs/integration/diagrams" in path_str:
                categories["integration"].append((file_path, metadata))
            else:
                categories["legacy"].append((file_path, metadata))
    
    return categories

def generate_table(diagrams: List[Tuple[Path, Dict[str, str]]], base_path: Path) -> str:
    """Generate markdown table for a category."""
    if not diagrams:
        return "*No diagrams in this category*\n"
    
    lines = ["| Diagram | Path | Type |", "| ------- | ---- | ---- |"]
    
    for file_path, metadata in diagrams:
        # Calculate relative path from index.md location
        try:
            rel_path = Path("../..") / file_path.relative_to("docs")
        except ValueError:
            rel_path = file_path
        
        title = metadata["title"]
        diagram_type = metadata["type"]
        path_str = str(file_path)
        
        lines.append(f"| [{title}]({rel_path}) | `{path_str}` | {diagram_type} |")
    
    return "\n".join(lines) + "\n"

def main():
    """Generate the index file."""
    categories = categorize_diagrams()
    
    total_count = sum(len(diagrams) for diagrams in categories.values())
    
    # Build index content
    content = f"""# Mermaid Diagram Suite - Config & Navigation Index

## 📍 Purpose

This index serves as the central navigation hub for all Mermaid diagrams in ProspectPro. All diagrams reference this file in their YAML frontmatter via the `index` field.

## 🗂️ Diagram Inventory

### App Source Diagrams (`docs/app/diagrams/`)

{generate_table(categories["app"], Path("docs/mmd-shared/config"))}

### Dev Tools Diagrams (`docs/dev-tools/diagrams/`)

{generate_table(categories["dev-tools"], Path("docs/mmd-shared/config"))}

### Integration Diagrams (`docs/integration/diagrams/`)

{generate_table(categories["integration"], Path("docs/mmd-shared/config"))}

### Legacy Diagrams (`docs/diagrams/`)

> **Note:** These appear to be duplicates or legacy diagrams. Consider consolidating with the domain-specific folders above.

{generate_table(categories["legacy"], Path("docs/mmd-shared/config"))}

## 📊 Summary Statistics

- **Total Diagrams:** {total_count}
- **App Source:** {len(categories["app"])}
- **Dev Tools:** {len(categories["dev-tools"])}
- **Integration:** {len(categories["integration"])}
- **Legacy/Duplicate:** {len(categories["legacy"])}

## ⚠️ Cleanup Recommendations

{_generate_cleanup_recommendations(categories)}

## 🔧 Configuration Files

- [Mermaid Config](./mermaid.config.json) - Theme, layout, and rendering settings
- [Icon Registry](./icon-registry.json) - Semantic emoji/icon mapping
- [Puppeteer Config](./puppeteer.config.json) - Browser automation settings

## 📚 Documentation

- [Enhanced Diagram Standards](../guidelines/enhanced-diagram-standards.md)
- [Mermaid Syntax Guide](../guidelines/mermaid-syntax-guide.md)
- [Suite README](../README.md)
- [Migration Summary](../MIGRATION_SUMMARY.md)
- [Maintenance Checklist](../MAINTENANCE_CHECKLIST.md)

## 🚀 Quick Actions

- **Validate all diagrams:** `npm run docs:validate`
- **Fix formatting issues:** `npm run docs:fix`
- **Generate new diagrams:** `bash docs/mmd-shared/scripts/scaffold-diagrams.sh`
- **Regenerate this index:** `python3 docs/mmd-shared/scripts/generate-index.py`

---

**Last Updated:** {datetime.now().strftime("%Y-%m-%d")}  
**Maintained by:** ProspectPro DevTools Team  
**Auto-generated:** This file is generated from actual .mmd files. Do not edit manually.
"""
    
    # Write to file
    output_path = Path("docs/mmd-shared/config/index.md")
    output_path.write_text(content, encoding='utf-8')
    print(f"✓ Generated index at {output_path}")
    print(f"  Total diagrams: {total_count}")
    print(f"  - App: {len(categories['app'])}")
    print(f"  - Dev Tools: {len(categories['dev-tools'])}")
    print(f"  - Integration: {len(categories['integration'])}")
    print(f"  - Legacy: {len(categories['legacy'])}")

def _generate_cleanup_recommendations(categories: Dict[str, List]) -> str:
    """Generate cleanup recommendations based on duplicates."""
    if not categories["legacy"]:
        return "✅ No cleanup needed. All diagrams are in their proper domain folders."
    
    recommendations = [
        "The `docs/diagrams/` folder contains diagrams that may be duplicates:",
        "",
        "**Recommended Actions:**",
        "1. Review legacy diagrams for duplicates",
        "2. Consolidate to domain-specific folders (`docs/app/diagrams/`, `docs/dev-tools/diagrams/`, `docs/integration/diagrams/`)",
        "3. Update all references in documentation",
        "4. Remove the legacy `docs/diagrams/` folder after consolidation",
    ]
    
    return "\n".join(recommendations)

if __name__ == "__main__":
    main()
