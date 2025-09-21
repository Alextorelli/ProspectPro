# ProspectPro MCP Server & Docker Setup Instructions

## Overview

This guide covers setting up a Model Context Protocol (MCP) server for ProspectPro to run tests and validate API integrations, plus an updated Docker configuration for production deployment.

## MCP Server Setup

### Prerequisites

1. **Install MCP SDK dependencies:**

```bash
cd /workspaces/ProspectPro
npm install -D @modelcontextprotocol/sdk dotenv
```

2. **Ensure environment variables are configured:**

```bash
# Required for Foursquare integration
FOURSQUARE_SERVICE_API_KEY=your_service_api_key
FOURSQUARE_PLACES_API_KEY=optional_legacy_fallback
FOURSQUARE_PLACES_API_VERSION=2025-06-17

# Other ProspectPro API keys as needed
GOOGLE_PLACES_API_KEY=your_google_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_secret_key
```

### MCP Server Implementation

The MCP server (`tools/mcp/mcp-server.js`) provides the following tools:

#### Available Tools

1. **`run_tests`** - Execute npm test scripts

   - Parameters: `script` (optional), `timeoutMs` (optional)
   - Example: `{ "script": "test:foursquare", "timeoutMs": 30000 }`

2. **`foursquare_search`** - Search places via Foursquare Places API

   - Parameters: `query`, `ll` (lat,lng), `radius`, `limit`, `sort`, `categories`
   - Example: `{ "query": "coffee", "ll": "37.7749,-122.4194", "limit": 5 }`

3. **`foursquare_details`** - Get place details by Foursquare ID

   - Parameters: `id` (fsq_place_id)
   - Example: `{ "id": "5eeb8d12a41b0b00085eb249" }`

4. **`test_foursquare_integration`** - Run the Foursquare integration test

   - Parameters: `timeoutMs` (optional)
   - Example: `{ "timeoutMs": 30000 }`

5. **`health_check`** - Check server health endpoints
   - Parameters: `endpoint`, `host`
   - Example: `{ "endpoint": "/health", "host": "localhost:3000" }`

### Running the MCP Server

#### Method 1: Direct execution

```bash
node tools/mcp/mcp-server.js
```

#### Method 2: Add to package.json scripts

```json
{
  "scripts": {
    "mcp:server": "node tools/mcp/mcp-server.js",
    "test:foursquare": "node test/test-foursquare-integration.js"
  }
}
```

Then run:

```bash
npm run mcp:server
```

### MCP Client Configuration

Configure your MCP-compatible client to connect to the ProspectPro server:

```json
{
  "mcpServers": {
    "prospectpro": {
      "command": "node",
      "args": ["tools/mcp/mcp-server.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Testing the MCP Server

1. **Start the server:**

```bash
npm run mcp:server
```

2. **Test Foursquare integration via MCP client:**

```json
{
  "tool": "foursquare_search",
  "parameters": {
    "query": "Starbucks",
    "ll": "37.7749,-122.4194",
    "limit": 3,
    "radius": 5000
  }
}
```

3. **Run integration tests:**

```json
{
  "tool": "test_foursquare_integration",
  "parameters": {
    "timeoutMs": 30000
  }
}
```

## Docker Configuration Updates

### Enhanced Dockerfile Features

The updated `Dockerfile` includes:

- **Lockfile fallback:** Works with or without `package-lock.json`
- **Writable uploads directory:** Creates and owns `/app/uploads` for the `node` user
- **Health checks:** Built-in container health monitoring via `/health` endpoint
- **Security:** Runs as non-root `node` user with proper permissions
- **Network accessibility:** Binds to `0.0.0.0` for container access

### Building and Running with Docker

#### 1. Build the image:

```bash
docker build -t prospectpro:latest .
```

#### 2. Run locally with environment file:

```bash
docker run --rm -p 3000:3000 \
  --env-file .env \
  -v "$PWD/uploads:/app/uploads" \
  --name prospectpro \
  prospectpro:latest
```

#### 3. Health checks:

```bash
# Basic health check
curl -fsS http://localhost:3000/health

# Liveness probe (lightweight)
curl -fsS http://localhost:3000/live

# Readiness probe (requires DB connection)
curl -fsS http://localhost:3000/ready
```

#### 4. Container logs and monitoring:

```bash
# View container logs
docker logs prospectpro

# Check container health status
docker inspect --format='{{.State.Health.Status}}' prospectpro
```

### Development Container Integration

The existing `.devcontainer/devcontainer.json` works seamlessly:

- **Docker-in-Docker:** Can build and run containers from within the dev container
- **Port forwarding:** Port 3000 is automatically forwarded
- **Dependencies:** Installs necessary tools including Docker and Supabase CLI

### Production Deployment Notes

#### Environment Variables

- **Never bake `.env` into the image**
- Use platform-specific environment variable injection (Railway, AWS, etc.)
- The `.dockerignore` already excludes `.env` files

#### Security Considerations

- Container runs as non-root `node` user
- Uploads directory has restricted permissions
- Health checks use localhost-only endpoints

#### Railway Deployment

```bash
# Railway will automatically:
# - Override PORT environment variable
# - Inject platform environment variables
# - Use the HEALTHCHECK for monitoring
# - Handle container scaling and restarts
```

### Troubleshooting

#### Common Issues

1. **MCP Server won't start:**

   - Check that `@modelcontextprotocol/sdk` is installed
   - Verify `.env` file is present and readable
   - Check Node.js version (requires Node 18+)

2. **Foursquare API errors:**

   - Verify `FOURSQUARE_SERVICE_API_KEY` is set correctly
   - Check API key permissions and quotas
   - Ensure `FOURSQUARE_PLACES_API_VERSION` is current

3. **Docker build failures:**

   - Check that `package.json` exists in the build context
   - Verify Docker daemon is running
   - Ensure sufficient disk space for image layers

4. **Container networking issues:**
   - Confirm `HOST=0.0.0.0` environment variable is set
   - Check port mapping (`-p 3000:3000`)
   - Verify firewall settings if accessing remotely

### Next Steps

1. **Extend MCP tools:** Add more ProspectPro-specific tools (database queries, campaign management, etc.)
2. **CI/CD integration:** Use MCP server in automated testing pipelines
3. **Monitoring:** Integrate with observability platforms using the health check endpoints
4. **Scaling:** Consider using Docker Compose or Kubernetes for multi-container deployments

### Example MCP Client Usage

```javascript
// Example: Using the MCP client to test Foursquare integration
const mcpClient = new MCPClient({
  serverCommand: "node",
  serverArgs: ["tools/mcp/mcp-server.js"],
});

// Search for places
const searchResult = await mcpClient.callTool("foursquare_search", {
  query: "restaurant",
  ll: "37.7749,-122.4194",
  limit: 10,
});

// Run integration tests
const testResult = await mcpClient.callTool("test_foursquare_integration");

// Check server health
const healthResult = await mcpClient.callTool("health_check", {
  endpoint: "/ready",
});
```

This setup provides a robust foundation for testing, monitoring, and deploying ProspectPro with both MCP integration capabilities and production-ready Docker containerization.
