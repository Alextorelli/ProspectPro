# ProspectPro Monitoring Dashboard

## Overview

The ProspectPro monitoring dashboard is a lightweight, real-time web interface for tracking lead generation campaigns, API costs, and system status. Built with pure HTML/CSS/JavaScript for simplicity and reliability.

## Quick Start

### 1. Server Setup
```bash
cd ProspectPro_REBUILD
npm install
npm start
```

### 2. Access Dashboard
Open your browser to: `http://localhost:3000/monitoring`

## Features

### Real-Time Monitoring
- **System Status**: Live API connectivity checks
- **Cost Tracking**: Real-time spend monitoring with budget alerts
- **Activity Feed**: Live campaign and discovery events
- **Performance Metrics**: Success rates, response times, error tracking

### API Integrations
- **Google Places**: Business discovery and validation
- **Scrapingdog**: Website scraping and content extraction
- **Hunter.io**: Email discovery and verification
- **NeverBounce**: Email deliverability validation
- **Supabase**: Database operations and metrics storage

### Dashboard Components

#### System Status Card
```
✅ API Services Online
✅ Database Connected
✅ All Validations Passing
```

#### Cost Tracking Card
```
Daily Spend: $12.34 / $50.00
Monthly Total: $234.56
Budget Status: On Track
```

#### Recent Activity Feed
```
2024-01-15 14:30:23 | Business Discovery | 15 leads found | $2.30
2024-01-15 14:25:15 | Email Verification | 12 emails validated | $1.20
```

## Technical Architecture

### Frontend Stack
- **HTML5**: Semantic structure with real-time updates
- **CSS3**: Modern design system with light/dark modes
- **Vanilla JavaScript**: Zero dependencies, direct API calls
- **Chart.js**: Data visualization for metrics and trends

### Backend Integration
- **Express.js**: `/monitoring` route serves dashboard files
- **Supabase Client**: Real-time database connections
- **API Clients**: Direct integration with external services

### File Structure
```
public/monitoring/
├── index.html          # Main dashboard interface
├── dashboard-app.js    # Real-time monitoring logic
└── dashboard-style.css # Professional styling system
```

## Configuration

### Environment Variables
The dashboard automatically inherits configuration from your `.env` file:

```env
# Google Places API
GOOGLE_PLACES_API_KEY=your_key_here

# Scrapingdog API
SCRAPINGDOG_API_KEY=your_key_here

# Hunter.io API
HUNTER_API_KEY=your_key_here

# NeverBounce API
NEVERBOUNCE_API_KEY=your_key_here

# Supabase Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

### Budget Settings
Configure spending limits in `dashboard-app.js`:

```javascript
const BUDGET_LIMITS = {
    daily: 50.00,
    monthly: 1500.00,
    campaign: 200.00
};
```

## API Endpoints

### Dashboard Data Export
```
GET /api/dashboard-export
```
Returns comprehensive dashboard data including:
- Real-time system status
- Cost breakdowns by service
- Recent activity logs
- Performance metrics

### Response Format
```json
{
    "status": "operational",
    "costs": {
        "today": 12.34,
        "month": 234.56,
        "breakdown": {
            "google_places": 8.50,
            "scrapingdog": 2.84,
            "hunter": 0.75,
            "neverbounce": 0.25
        }
    },
    "activity": [
        {
            "timestamp": "2024-01-15T14:30:23Z",
            "type": "business_discovery",
            "details": "15 leads found",
            "cost": 2.30
        }
    ],
    "metrics": {
        "success_rate": 94.5,
        "avg_response_time": 1.2,
        "error_rate": 0.8
    }
}
```

## Real-Time Updates

The dashboard refreshes automatically every 30 seconds to provide:
- Live cost tracking
- Real-time status updates
- Fresh activity logs
- Updated performance metrics

### Manual Refresh
Click the refresh button or press `Ctrl+R` to force immediate updates.

## Cost Management

### Budget Alerts
- **Yellow Alert**: 75% of budget reached
- **Red Alert**: 90% of budget reached
- **Stop Alert**: 100% of budget reached (auto-pause campaigns)

### Cost Optimization
- Pre-validation scoring reduces unnecessary API calls
- Batch processing minimizes request overhead
- Smart caching prevents duplicate validations

## Troubleshooting

### Dashboard Not Loading
1. Verify server is running: `npm start`
2. Check browser console for JavaScript errors
3. Confirm all environment variables are set

### API Connection Issues
1. Validate API keys in `.env` file
2. Check API rate limits and quotas
3. Review network connectivity

### Database Connection Problems
1. Verify Supabase URL and keys
2. Check database schema compatibility
3. Test connection with: `node database/test-supabase-connection.js`

## Security Considerations

### API Key Protection
- All API keys stored in server-side environment variables
- Frontend receives only aggregated data, never raw API responses
- Regular key rotation recommended

### Database Security
- Supabase RLS (Row Level Security) enabled
- Read-only dashboard access
- Encrypted connections (SSL/TLS)

## Performance Optimization

### Caching Strategy
- API responses cached for 5 minutes
- Dashboard data refreshed every 30 seconds
- Heavy computations performed server-side

### Resource Management
- Minimal JavaScript bundle size
- CSS optimized for fast rendering
- Efficient DOM updates with minimal reflow

## Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] API keys validated
- [ ] Database schema deployed
- [ ] SSL certificates installed
- [ ] Monitoring endpoints secured

### Railway Deployment
The dashboard automatically deploys with the main ProspectPro application:

```bash
railway up
```

Access via: `https://your-app.railway.app/monitoring`

## API Cost Tracking

### Real-Time Cost Calculation
```javascript
// Google Places: $0.032/search + $0.017/details
// Scrapingdog: $0.001/request
// Hunter.io: $0.05/email search
// NeverBounce: $0.008/email verification
```

### Historical Cost Analysis
View spending trends over:
- Last 24 hours
- Last 7 days
- Last 30 days
- Custom date ranges

## Support

For technical issues or feature requests:
1. Check this documentation
2. Review server logs: `npm run logs`
3. Test individual components: `npm run test`
4. Contact development team

---

*This monitoring dashboard replaces the previous Grafana implementation for improved simplicity and direct API integration.*