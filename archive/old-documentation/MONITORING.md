# 📊 ProspectPro Monitoring Guide

This guide covers the comprehensive monitoring and observability features built into ProspectPro.

## 📈 Prometheus Metrics

### Accessing Metrics
- **Endpoint**: `http://localhost:3000/metrics`
- **Format**: Prometheus exposition format
- **Update Frequency**: Real-time

### Available Metrics (21 custom metrics)

#### HTTP Performance Metrics
```
# HTTP request duration and count
prospectpro_http_requests_total{method, endpoint, status_code}
prospectpro_http_request_duration_seconds{method, endpoint}
```

#### Supabase Database Metrics
```
# Connection health and performance
prospectpro_supabase_connections_total{status, database}
prospectpro_supabase_connection_duration_seconds{status, database}
prospectpro_supabase_queries_total{operation, table}
prospectpro_supabase_query_duration_seconds{operation, table}
prospectpro_supabase_errors_total{type}
```

#### API Cost Tracking
```
# Real-time cost monitoring
prospectpro_api_costs_total{service}
prospectpro_api_requests_total{service, status}
prospectpro_budget_usage_ratio{campaign_id}
prospectpro_cost_per_lead_dollars{campaign_id}
```

#### Business Discovery Metrics
```
# Lead generation performance
prospectpro_businesses_discovered_total{source}
prospectpro_leads_qualified_total{criteria}
prospectpro_discovery_duration_seconds{location, business_type}
prospectpro_qualification_rate{location, business_type}
```

#### Campaign Activity
```
# User and campaign metrics  
prospectpro_campaigns_total{user_id, status}
prospectpro_campaign_duration_seconds{campaign_id}
prospectpro_exports_total{format, user_id}
prospectpro_searches_total{location, business_type}
```

#### Error Tracking
```
# Application health
prospectpro_errors_total{type, endpoint}
prospectpro_validation_failures_total{field, reason}
```

## 🔍 Boot Phase Debugging

### Accessing Boot Reports
- **Endpoint**: `http://localhost:3000/boot-report`
- **Real-time**: Updated during each server restart
- **Format**: JSON with detailed phase analysis

### Boot Phase Tracking
The system tracks these startup phases:

1. **dependencies-load** - Loading core modules
2. **core-init** - Express app initialization
3. **middleware-setup** - Security and application middleware
4. **google-places-init** - Google Places API client
5. **auth-setup** - Authentication middleware
6. **health-endpoints** - Health check endpoints
7. **server-bind** - Network port binding
8. **supabase-test** - Database connectivity test

### Boot Metrics
```json
{
  "bootId": "boot_1234567890123_abc123def",
  "totalTime": 325,
  "phases": 8,
  "successCount": 6,
  "failedCount": 2,
  "successRate": 75,
  "efficiency": 98,
  "overhead": 6,
  "status": "partial_success"
}
```

### Performance Indicators
- **Success Rate**: >75% indicates healthy startup
- **Efficiency**: >90% shows minimal overhead
- **Total Time**: <1000ms for optimal performance
- **Failed Phases**: 0-1 acceptable, >2 needs investigation

## 🏥 Health Monitoring

### Health Check Endpoints

#### Fast Health Check
```
GET /health
```
Returns quick status without database queries:
```json
{
  "status": "ok|degraded|error",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "2.0.0"
}
```

#### Comprehensive Diagnostics
```
GET /diag
```
Full system diagnostics including:
- Supabase connection testing
- Environment validation
- API client status
- Configuration verification

#### Readiness Probe
```
GET /ready
```
Kubernetes-style readiness check requiring database connectivity.

#### Event Loop Metrics
```
GET /loop-metrics
```
Node.js event loop performance monitoring.

## 🚨 Alerting & Monitoring Setup

### Recommended Alerts

#### Critical Alerts
- Boot success rate < 75%
- HTTP 5xx error rate > 5%
- Supabase connection failures > 10%
- API cost per lead > $1.00

#### Warning Alerts
- Boot time > 1000ms
- HTTP response time > 2s
- Rate limit triggers > 50/hour
- Campaign failure rate > 20%

### Example Prometheus Queries

#### High Error Rate
```promql
rate(prospectpro_http_requests_total{status_code=~"5.."}[5m]) > 0.05
```

#### Expensive Leads
```promql
prospectpro_cost_per_lead_dollars > 1.0
```

#### Database Issues
```promql
rate(prospectpro_supabase_errors_total[5m]) > 0.1
```

#### Boot Problems
```promql
prospectpro_boot_success_rate < 0.75
```

## 📊 Dashboard Setup

### Grafana Dashboard
Create dashboards with these panel types:

1. **System Health**
   - HTTP request rates and latencies
   - Error rates by endpoint
   - Boot phase performance

2. **Business Metrics**
   - Lead generation rates
   - Cost per lead trends
   - Campaign success rates

3. **Infrastructure**
   - Supabase connection health
   - Event loop performance
   - Memory and CPU usage

### Key Performance Indicators (KPIs)

| Metric | Target | Critical |
|--------|--------|----------|
| HTTP Response Time | <500ms | >2s |
| Error Rate | <1% | >5% |
| Boot Success Rate | >90% | <75% |
| Cost Per Lead | <$0.50 | >$1.00 |
| Lead Qualification Rate | >60% | <30% |
| API Success Rate | >95% | <85% |

## 🔧 Troubleshooting

### Common Issues

#### High Boot Time
1. Check `/boot-report` for slow phases
2. Examine Supabase connectivity
3. Verify API client initialization
4. Review dependency loading

#### Metric Collection Issues
1. Verify `/metrics` endpoint accessibility
2. Check Prometheus scraping configuration
3. Validate metric registration in logs
4. Ensure proper middleware ordering

#### Database Connection Problems
1. Use `/diag` for detailed analysis
2. Verify environment variables
3. Check Supabase dashboard status
4. Review RLS policy conflicts

## 📚 Integration Examples

### Docker Compose with Prometheus
```yaml
version: '3.8'
services:
  prospectpro:
    image: prospectpro:latest
    ports:
      - "3000:3000"
    
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

### Prometheus Configuration
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prospectpro'
    static_configs:
      - targets: ['prospectpro:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

This monitoring setup provides comprehensive visibility into ProspectPro's performance, costs, and business metrics.