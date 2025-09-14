# ProspectPro Grafana Dashboard Configuration

This directory contains Grafana dashboard configurations for ProspectPro lead generation analytics.

## Available Dashboards

### `prospect-pro-dashboard.json`
**ProspectPro Lead Generation Analytics Dashboard**

A comprehensive dashboard designed specifically for ProspectPro monitoring with panels for:

#### Overview Panels (Top Row)
- **Campaign Overview**: Active campaign count
- **Total Leads Discovered**: 24-hour lead discovery metrics  
- **Qualified Leads**: Qualified lead count with quality thresholds
- **Daily API Costs**: Real-time cost tracking with budget alerts

#### Performance Analytics
- **API Cost Trend**: 30-day cost visualization with trend analysis
- **API Service Breakdown**: Pie chart of service cost distribution
- **Lead Qualification Rate**: Time-series qualification percentage
- **Service Health Status**: Real-time service monitoring table

#### Detailed Analytics  
- **Campaign Performance**: Comprehensive campaign comparison table
- **API Response Times**: Performance monitoring by service
- **Error Rate by Service**: Service reliability metrics

#### Key Features:
- **Real-time updates**: 30-second refresh intervals
- **Cost monitoring**: Budget alerts and thresholds  
- **Quality metrics**: Lead qualification tracking
- **Service health**: API response time and error monitoring

### `supabase-reference.json`
Reference dashboard configuration from existing Grafana Cloud setup for structure comparison.

## Installation Instructions

### Import to Existing Grafana Account

1. **Login to Grafana Cloud**
   ```
   https://appsmithery.grafana.net/
   ```

2. **Import Dashboard**
   - Go to "+" menu → "Import"
   - Upload `prospect-pro-dashboard.json`
   - Configure data source (PostgreSQL connection to Supabase)

3. **Configure Data Source**
   ```json
   {
     "name": "ProspectPro PostgreSQL",
     "type": "postgres", 
     "url": "your-supabase-project.supabase.co:5432",
     "database": "postgres",
     "user": "postgres",
     "password": "your_supabase_password",
     "sslmode": "require"
   }
   ```

4. **Set Variables**
   - `DS_POSTGRESQL`: Select your PostgreSQL data source
   - Refresh intervals and time ranges as needed

## Dashboard Customization

### Adding Custom Panels
Use the monitoring queries from `../monitoring-queries.md` to create additional panels:

```sql
-- Example: Top Performing Campaigns
SELECT 
  c.name,
  COUNT(b.id) as leads,
  SUM(CASE WHEN b.is_qualified THEN 1 ELSE 0 END) as qualified,
  ROUND(AVG(b.confidence_score), 2) as avg_score
FROM campaigns c
LEFT JOIN businesses b ON c.id = b.campaign_id  
WHERE c.created_at >= now() - INTERVAL '7 days'
GROUP BY c.id, c.name
ORDER BY qualified DESC
LIMIT 10;
```

### Modifying Thresholds
Update alert thresholds in panel configurations:

```json
"thresholds": {
  "steps": [
    {"color": "green", "value": null},
    {"color": "yellow", "value": 25},   // Warning at $25 daily cost
    {"color": "red", "value": 50}       // Critical at $50 daily cost
  ]
}
```

### Custom Time Ranges
Modify default time ranges for specific business needs:

```json
"time": {
  "from": "now-7d",    // Last 7 days
  "to": "now"
},
"refresh": "1m"        // 1-minute refresh
```

## Maintenance

### Regular Updates
- **Panel queries**: Review and optimize as schema evolves
- **Thresholds**: Adjust based on business growth and budgets
- **Variables**: Update data source connections as needed

### Performance Optimization
- **Query caching**: Enable for frequently accessed panels
- **Index monitoring**: Ensure proper database indexes exist
- **Refresh rates**: Balance real-time needs with performance

### Backup
Export dashboard configurations regularly:
```bash
# Via Grafana API
curl -X GET \
  "https://appsmithery.grafana.net/api/dashboards/uid/prospect-pro-analytics" \
  -H "Authorization: Bearer your_api_key" > backup.json
```

## Troubleshooting

### Common Issues

**Data source connection errors**
- Verify Supabase connection details
- Check firewall and SSL requirements
- Validate database credentials

**Missing data in panels**
- Confirm monitoring schema is deployed
- Verify table names match dashboard queries
- Check time range settings

**Slow dashboard loading**
- Review query performance
- Add database indexes for common filters
- Reduce data retention periods

### Support Resources
- [Grafana Documentation](https://grafana.com/docs/)
- [PostgreSQL Data Source Guide](https://grafana.com/docs/grafana/latest/datasources/postgres/)
- [ProspectPro Monitoring Setup](../README.md)

---

**Dashboard Status**: ✅ Production Ready  
**Last Updated**: $(date)  
**Version**: 1.0.0  
**Compatibility**: Grafana Cloud, Grafana v8.0+