# ProspectPro MCP (Model Context Protocol) Implementation

## Overview

This directory contains the MCP server implementations that provide AI assistants with direct access to ProspectPro's data and functionality. MCP enables sophisticated AI-powered development workflows by connecting language models to your actual business data, APIs, and system diagnostics.

## MCP Servers

### 1. Database Server (`database-server.js`)

**Purpose**: Direct AI access to Supabase database for lead analysis and management

**Capabilities**:

- Query enhanced leads with filters and analytics
- Get campaign statistics and performance metrics
- Analyze lead quality patterns and scoring distribution
- Retrieve API cost breakdowns and budget analysis

**Tools**:

- `query_leads`: Query enhanced_leads table with filters
- `get_campaign_stats`: Get campaign performance metrics
- `analyze_lead_quality`: Analyze lead quality patterns
- `get_api_costs`: Retrieve API cost breakdown

### 2. API Management Server (`api-server.js`)

**Purpose**: AI access to external API clients for testing and simulation

**Capabilities**:

- Test Google Places API with sample queries
- Test Foursquare Places API integration
- Test Hunter.io email discovery
- Verify email deliverability with NeverBounce
- Simulate complete lead discovery pipeline

**Tools**:

- `test_google_places`: Test Google Places API
- `test_foursquare_places`: Test Foursquare integration
- `test_email_discovery`: Test Hunter.io email discovery
- `verify_email`: Verify email with NeverBounce
- `simulate_lead_discovery`: Run full discovery simulation

### 3. Filesystem Analysis Server (`filesystem-server.js`)

**Purpose**: AI access to codebase analysis and architectural insights

**Capabilities**:

- Analyze project structure and architecture
- Search for code patterns and potential issues
- Analyze API client implementations
- Check for fake data violations (critical for ProspectPro)
- Analyze error handling patterns

**Tools**:

- `analyze_project_structure`: Complete project analysis
- `find_code_patterns`: Search for specific patterns
- `analyze_api_clients`: API client analysis
- `check_fake_data_violations`: Detect fake data patterns
- `analyze_error_handling`: Error handling analysis

### 4. Monitoring Server (`monitoring-server.js`)

**Purpose**: AI access to system diagnostics and performance monitoring

**Capabilities**:

- System health monitoring
- Diagnostics file analysis
- Log analysis and pattern detection
- Docker status checking
- Configuration validation
- Performance reporting

**Tools**:

- `get_system_health`: Comprehensive health status
- `read_diagnostics`: Analyze diagnostics.json
- `analyze_logs`: Log pattern analysis
- `check_docker_status`: Docker container status
- `validate_configuration`: Config validation
- `generate_performance_report`: Performance analysis

## Installation & Setup

### 1. Install MCP Dependencies

```bash
# Install MCP server dependencies
npm run mcp:install
```

### 2. Test MCP Implementation

```bash
# Test all MCP servers
npm run mcp:test
```

### 3. VS Code Configuration

The MCP configuration is automatically set up in:

- `.vscode/mcp-config.json`: MCP server definitions
- `.vscode/settings.json`: MCP enablement and configuration

### 4. Environment Requirements

MCP servers require the same environment variables as the main application:

- `SUPABASE_URL`: Database connection
- `SUPABASE_SECRET_KEY`: Database access
- API keys for external services (when testing APIs)

## Usage Examples

### Database Queries via AI

```
"Show me the top 10 leads with confidence scores above 85"
"Analyze lead quality patterns for restaurants in New York"
"What are the API costs for the last 24 hours?"
```

### API Testing via AI

```
"Test the Google Places API with a search for 'coffee shops in Seattle'"
"Simulate lead discovery for 'restaurants' in 'San Francisco'"
"Verify the email address john@example.com"
```

### Codebase Analysis via AI

```
"Analyze the project structure and identify key components"
"Check for any fake data generation patterns in the code"
"Find all error handling patterns in API clients"
```

### System Monitoring via AI

```
"Check the overall system health status"
"Analyze recent application logs for errors"
"Generate a performance report with recommendations"
```

## Advanced AI Workflows

### 1. Lead Quality Analysis

AI can now directly query your database to provide insights like:

- "Which business types have the highest confidence scores?"
- "What's the correlation between email confidence and overall lead quality?"
- "Show me leads that failed validation and why"

### 2. API Cost Optimization

AI can analyze your API usage patterns:

- "Which APIs are costing the most money?"
- "Are we approaching any quota limits?"
- "Suggest optimizations to reduce API costs"

### 3. Code Quality Assurance

AI can continuously monitor code quality:

- "Are there any patterns that could lead to fake data generation?"
- "Analyze error handling coverage across all modules"
- "Check if all API clients follow the same patterns"

### 4. System Performance Monitoring

AI can provide system insights:

- "Is the system performing optimally?"
- "What are the largest files that might be slowing down development?"
- "Are there any configuration issues that need attention?"

## MCP Server Management

### Individual Server Commands

```bash
# Start specific MCP servers
npm run mcp:start:database    # Database access
npm run mcp:start:api         # API testing
npm run mcp:start:filesystem  # Code analysis
npm run mcp:start:monitoring  # System monitoring

# Start all servers (for development)
npm run mcp:start:all
```

### Server Status Monitoring

```bash
# Test all servers
npm run mcp:test

# Check detailed test results
cat mcp-servers/test-results.json
```

## Security Considerations

### Data Access Control

- MCP servers use the same authentication as the main application
- Database access is limited to read-only operations where appropriate
- API keys are passed through environment variables only

### AI Context Boundaries

- MCP servers provide structured access to prevent unauthorized operations
- Each server has defined capabilities and cannot exceed its scope
- Error handling prevents sensitive information leakage

## Troubleshooting

### Common Issues

1. **MCP Servers Not Starting**

   - Check dependencies: `npm run mcp:install`
   - Verify environment variables are set
   - Run tests: `npm run mcp:test`

2. **VS Code Not Recognizing MCP**

   - Restart VS Code after configuration changes
   - Check `.vscode/mcp-config.json` syntax
   - Verify MCP is enabled in settings

3. **Database Connection Issues**

   - Check Supabase credentials
   - Verify database server status
   - Run diagnostics: `curl http://localhost:3000/diag`

4. **API Testing Failures**
   - Verify API keys are configured
   - Check API quota limits
   - Test individual APIs outside MCP first

## Development Notes

### Adding New MCP Tools

1. Add tool definition to the server's `tools/list` handler
2. Implement tool execution in `tools/call` handler
3. Update this documentation
4. Add tests to `test-servers.js`

### Best Practices

- Keep tools focused on specific functionality
- Provide detailed error messages
- Include usage examples in tool descriptions
- Implement proper error handling and validation
- Cache expensive operations where appropriate

## Integration with ProspectPro Architecture

The MCP implementation follows ProspectPro's core principles:

### Zero Fake Data Policy

- The filesystem server actively checks for fake data patterns
- All database queries return real, validated business data
- API testing uses actual external service endpoints

### Cost Optimization

- API servers track usage and costs
- Monitoring servers provide budget analysis
- Caching strategies are implemented throughout

### Performance Monitoring

- Real-time system health monitoring
- Performance analysis and recommendations
- Comprehensive diagnostics and logging

This MCP implementation transforms ProspectPro development into an AI-enhanced workflow where intelligent assistants have direct access to your real business data, APIs, and system insights.
