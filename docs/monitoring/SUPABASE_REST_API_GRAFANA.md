# Supabase REST API Connection for Grafana

## Background
If PostgreSQL direct connection fails due to network (IPv6/IPv4) issues, Supabase provides a REST API that Grafana can use.

## Setup Instructions

### 1. Data Source Configuration

**Data Source Type**: JSON API (or HTTP if JSON API not available)

**Base URL**: 
```
https://vvxdprgfltzblwvpedpx.supabase.co/rest/v1
```

**Headers**:
```yaml
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGRwcmdmbHR6Ymx3dnBlZHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MTgzOTksImV4cCI6MjA0MDI5NDM5OX0.TZ9kR6FfNvnZMJF9P6NX6rYSVfM3LRw7BfGK7U6YXwc
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGRwcmdmbHR6Ymx3dnBlZHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MTgzOTksImV4cCI6MjA0MDI5NDM5OX0.TZ9kR6FfNvnZMJF9P6NX6rYSVfM3LRw7BfGK7U6YXwc
Content-Type: application/json
```

### 2. API Endpoints for Monitoring Data

**API Cost Tracking**:
```
GET /api_cost_tracking?select=*&order=timestamp.desc
```

**Lead Qualification Metrics**:
```  
GET /lead_qualification_metrics?select=*&order=timestamp.desc
```

**Service Health Metrics**:
```
GET /service_health_metrics?select=*&order=timestamp.desc  
```

**Dashboard Exports**:
```
GET /dashboard_exports?select=*&order=created_at.desc
```

### 3. Test Connection

You can test this connection works by visiting in browser:
```
https://vvxdprgfltzblwvpedpx.supabase.co/rest/v1/api_cost_tracking?select=*&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGRwcmdmbHR6Ymx3dnBlZHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MTgzOTksImV4cCI6MjA0MDI5NDM5OX0.TZ9kR6FfNvnZMJF9P6NX6rYSVfM3LRw7BfGK7U6YXwc
```

This should return JSON data from the monitoring tables.

## Advantages of REST API Approach

1. **No Network Issues**: HTTPS typically works better than PostgreSQL protocol
2. **Simpler Authentication**: Uses API keys instead of SSL certificates  
3. **Better Error Messages**: HTTP responses are clearer than database connection errors
4. **Built-in Rate Limiting**: Supabase handles request management

## Dashboard Queries (REST API Format)

Instead of SQL queries, you'll use HTTP endpoints:

**Total API Costs Today**:
```
/api_cost_tracking?select=cost&timestamp=gte.2024-01-01T00:00:00Z&timestamp=lt.2024-01-02T00:00:00Z
```

**Qualified Leads Count**:
```
/lead_qualification_metrics?select=qualified_leads_count&order=timestamp.desc&limit=1
```

**Service Health Status**:
```
/service_health_metrics?select=*&order=timestamp.desc&limit=10
```

Let me know if you want to try this REST API approach instead of the PostgreSQL connection!