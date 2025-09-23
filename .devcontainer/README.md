# 🌲 ProspectPro Development Container

## Visual Organization with Vira Deepforest Theme

This development container is configured with the **Vira Deepforest** theme to provide:

### 🎨 **Visual Benefits**

- **Deep Forest Green** color scheme for focused development
- **Enhanced contrast** for better code readability
- **Distinct visual identity** to separate dev work from production
- **Organized file icons** with VSCode Icons theme
- **Custom color customizations** for UI elements

### 🚀 **Development Features**

- **MCP (Model Context Protocol)** enabled for AI-enhanced development
- **API testing tools** (REST Client, Thunder Client)
- **Database tools** (SQLTools with PostgreSQL support)
- **Git integration** with GitLens
- **Performance optimizations** for container environment

## Theme Configuration

The container automatically applies:

```json
{
  "workbench.colorTheme": "Vira Deepforest",
  "workbench.iconTheme": "vscode-icons",
  "workbench.colorCustomizations": {
    "[Vira Deepforest]": {
      "titleBar.activeBackground": "#1a4d3a",
      "statusBar.background": "#1a4d3a",
      "activityBar.background": "#0d2818",
      "panel.background": "#0a1f14"
    }
  }
}
```

## Container Startup

When the container starts, you'll see:

```
🌲 ProspectPro Development Container Started
Theme: Vira Deepforest | MCP: Enabled | Ready for API Integration
💡 Use Copilot Chat for AI-assisted development with full system context
```

## Visual Organization Benefits

### **Color-Coded Development States**

- 🌲 **Green Theme**: Development container
- 🔵 **Blue Theme**: Local development (if different theme used)
- 🔴 **Red/Orange**: Production (when configured)

### **Enhanced File Organization**

- Clear file type icons with VSCode Icons
- Breadcrumbs enabled for better navigation
- Custom rulers at 80 and 120 characters
- Bracket pair colorization for complex API code

### **Terminal Customization**

- Custom bash profile with development indicators
- Green terminal accent color
- Enhanced font rendering
- Development-specific prompt

## MCP Integration

The development container includes:

1. **Database MCP Server** - Direct access to Supabase leads data
2. **API MCP Server** - Testing and comparison tools for all APIs
3. **Filesystem MCP Server** - Code analysis and pattern detection
4. **Monitoring MCP Server** - Real-time system diagnostics

## API Development Workflow

### Visual Organization for API Work:

1. **File Explorer** - Organized with clear icons and colors
2. **Terminal Panel** - Green-themed for easy identification
3. **Editor Groups** - Consistent deep forest background
4. **Status Bar** - Development status at a glance

### Enhanced Development Experience:

- Breadcrumbs for complex API client navigation
- Color-coded bracket pairs for nested API responses
- Rulers to maintain code formatting standards
- Optimized search excluding build/log files

## Usage

```bash
# Open in dev container
code --folder-uri vscode-remote://dev-container+ProspectPro/workspace

# Container will automatically:
# 1. Install all dependencies
# 2. Apply Vira Deepforest theme
# 3. Configure MCP servers
# 4. Set up API testing tools
# 5. Display ready message
```

## Theme Customization

To modify the development theme, edit:

- `.devcontainer/devcontainer.json` - Container-wide settings
- `.devcontainer/devcontainer-workspace.code-workspace` - Workspace-specific customizations

The theme helps maintain visual separation between:

- Development work (green/forest theme)
- Testing environments (can be configured differently)
- Production environments (typically more neutral themes)

This visual organization reduces context switching mental overhead and helps maintain focus during intensive API integration work.

## Ready for Development! 🚀

Your development container now provides:

- **Visual clarity** with the Deepforest theme
- **AI-enhanced development** with MCP
- **Complete API testing suite**
- **Real-time system monitoring**
- **Database-aware development**

Start developing with confidence knowing your environment is visually organized and AI-enhanced!
