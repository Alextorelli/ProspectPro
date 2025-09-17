# 🛡️ ProspectPro Security Guide

This guide covers the comprehensive security features and hardening measures implemented in ProspectPro.

## 🔒 Security Architecture

ProspectPro implements a defense-in-depth security model with multiple layers:

1. **Network Security** - HTTPS, CORS, security headers
2. **Application Security** - Rate limiting, input validation, authentication
3. **Database Security** - Row Level Security (RLS), encrypted connections
4. **Access Control** - Token-based authentication, user isolation
5. **Monitoring Security** - Security event tracking, anomaly detection

## 🏛️ Row Level Security (RLS)

### Implementation Overview
ProspectPro uses PostgreSQL's Row Level Security to ensure complete data isolation between users.

### RLS Policies

#### User Isolation
All data tables implement user-scoped access:
```sql
-- Example: enhanced_leads table
CREATE POLICY "Users can only see own enhanced_leads" ON enhanced_leads
FOR ALL USING (auth.uid() = user_id);
```

#### Campaign Ownership
Campaign data is restricted to the creating user:
```sql  
CREATE POLICY "Users can only see own campaigns" ON campaigns
FOR ALL USING (auth.uid() = user_id);
```

#### Admin Access
Administrative functions require special privileges:
```sql
CREATE POLICY "Admins can see all data" ON enhanced_leads
FOR ALL USING (auth.role() = 'admin');
```

### RLS Security Script
Execute the comprehensive RLS hardening script:
```bash
psql -f database/rls-security-hardening.sql
```

The script implements:
- ✅ RLS enablement on all tables
- ✅ Removal of permissive policies  
- ✅ Secure user-isolated policies
- ✅ Performance optimization indexes
- ✅ Security definer function fixes
- ✅ Verification and testing

## 🛡️ Application Security

### Security Middleware Stack

#### 1. Helmet Security Headers
```javascript
// Comprehensive security headers
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})
```

#### 2. CORS Configuration
```javascript
// Controlled cross-origin access
cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
  credentials: true,
  optionsSuccessStatus: 200
})
```

#### 3. Rate Limiting
Three-tier rate limiting system:

**General API (100 requests/15 minutes)**
- Applied to all API endpoints
- Uses user ID or IP for identification
- Excludes health check endpoints

**Expensive Operations (10 requests/hour)**
- Applied to costly operations (business discovery, exports)
- Protects against API quota abuse
- Stricter limits for resource-intensive endpoints

**Admin Operations (30 requests/15 minutes)**
- Specialized limits for administrative functions
- Enhanced logging and monitoring
- IP-based identification only

### Input Validation & Sanitization

#### Request Validation
```javascript
// Example validation middleware
const validateBusinessSearch = (req, res, next) => {
  const { location, businessType } = req.body;
  
  // Sanitize inputs
  req.body.location = validator.escape(location?.trim() || '');
  req.body.businessType = validator.escape(businessType?.trim() || '');
  
  // Validate required fields
  if (!req.body.location || req.body.location.length < 2) {
    return res.status(400).json({
      error: 'Invalid location',
      message: 'Location must be at least 2 characters'
    });
  }
  
  next();
};
```

## 🔑 Authentication & Authorization

### Admin Token Authentication
```javascript
// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || token !== process.env.PERSONAL_ACCESS_TOKEN) {
    console.warn(`🚫 Unauthorized admin access attempt from ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.isAdmin = true;
  next();
};
```

### User Session Management
- Supabase JWT token validation
- Session timeout handling
- Automatic token refresh
- Secure cookie settings

## 🚨 Security Monitoring

### Security Events Tracking
The application tracks security-relevant events:

#### Rate Limiting Events
```javascript
// Rate limit exceeded tracking
prospectpro_rate_limits_triggered_total{type, user_id, endpoint}
```

#### Authentication Events  
```javascript
// Authentication attempt tracking
prospectpro_auth_attempts_total{result, method, user_agent}
```

#### Access Violations
```javascript
// Unauthorized access attempts
prospectpro_access_violations_total{type, endpoint, user_id}
```

### Security Alerting

#### High-Priority Alerts
- Multiple failed authentication attempts (>5 in 5 minutes)
- Rate limit violations (>50 per hour per IP)
- Admin access attempts with invalid tokens
- Unusual API usage patterns

#### Monitoring Queries
```promql
# Failed authentication rate
rate(prospectpro_auth_attempts_total{result="failed"}[5m]) > 0.1

# High rate limit violations  
rate(prospectpro_rate_limits_triggered_total[1h]) > 50

# Admin access violations
prospectpro_access_violations_total{type="admin"} > 0
```

## 🔐 Environment Security

### Secure Configuration
```bash
# Required secure environment variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your-secret-key

# Optional hardening
PERSONAL_ACCESS_TOKEN=secure-random-token-256-bits
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
NODE_ENV=production

# Security headers
HELMET_CSP_ENABLED=true
CORS_ENABLED=true
RATE_LIMITING_ENABLED=true
```

### Key Management Best Practices

#### Supabase Keys
- Use `SUPABASE_SECRET_KEY` (preferred) over legacy service role keys
- Rotate keys regularly through Supabase dashboard  
- Never commit keys to version control
- Use Railway environment variables for secure storage

#### API Keys
- Store all API keys as environment variables
- Implement key rotation procedures
- Monitor usage and set quotas
- Use service-specific IAM where available

## 🏗️ Deployment Security

### Railway Security Configuration
```bash
# Production environment variables
NODE_ENV=production
HELMET_ENABLED=true
RATE_LIMITING_ENABLED=true
SECURE_COOKIES=true
HTTPS_ONLY=true
```

### Database Security
- SSL/TLS encrypted connections only
- Connection pooling with authentication
- Regular backup verification
- Database access logging

### Network Security
- HTTPS redirect enforcement
- Security headers (HSTS, CSP, etc.)
- CORS policy enforcement
- IP-based rate limiting

## 🔍 Security Auditing

### Regular Security Checks
```bash
# Run security audit script
node scripts/security-audit.js

# Check for vulnerabilities
npm audit

# Validate environment security
node scripts/validate-environment.js
```

### Security Metrics Dashboard
Monitor these security KPIs:

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Failed Auth Rate | <1/minute | >5/minute |
| Rate Limit Violations | <10/hour | >50/hour |  
| Admin Access Attempts | Expected only | >0 unexpected |
| SQL Injection Attempts | 0 | >0 |
| XSS Attempts | 0 | >0 |

## 🚨 Incident Response

### Security Incident Procedures

#### 1. Detection
- Monitor security metrics continuously
- Set up alerting for threshold breaches
- Review logs for suspicious patterns

#### 2. Response
- Block malicious IPs via rate limiting
- Rotate compromised credentials immediately
- Scale up monitoring and logging
- Document incident details

#### 3. Recovery
- Verify system integrity
- Update security measures
- Conduct post-incident review
- Update procedures and training

### Emergency Contacts
- Railway Support: support@railway.app
- Supabase Support: support@supabase.io
- Application Owner: [Your Contact]

## 📋 Security Checklist

### Pre-Deployment
- [ ] All environment variables configured securely
- [ ] RLS policies tested and verified
- [ ] Rate limiting thresholds appropriate
- [ ] Security headers configured
- [ ] CORS policies restrictive enough
- [ ] Admin token set and secured

### Post-Deployment  
- [ ] Security monitoring active
- [ ] Alerts configured and tested
- [ ] Access logs reviewed
- [ ] Performance impact assessed
- [ ] Documentation updated
- [ ] Team training completed

### Ongoing Maintenance
- [ ] Monthly security metric reviews
- [ ] Quarterly access control audits
- [ ] Annual penetration testing
- [ ] Continuous dependency updates
- [ ] Regular backup verification
- [ ] Incident response plan testing

This security framework provides comprehensive protection while maintaining application performance and usability.