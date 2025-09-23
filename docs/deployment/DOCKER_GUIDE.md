# 🐳 ProspectPro Docker Deployment Guide

Complete Docker-based deployment system for ProspectPro with development and production configurations.

## 🚀 Quick Start

### Development Environment

```bash
# Start development with live reload
npm run docker:dev

# Or manually:
./docker/start-dev.sh
```

### Production Deployment

```bash
# Deploy to production
npm run docker:prod

# Or manually:
./docker/deploy-prod.sh
```

### Client Package Creation

```bash
# Create client deployment package
npm run docker:package

# Generates: prospectpro-deploy-v3.0.0-TIMESTAMP.tar.gz
```

## 📁 Files Overview

```
ProspectPro/
├── Dockerfile                   # Production container
├── Dockerfile.dev              # Development container
├── docker-compose.yml          # Production services
├── docker-compose.dev.yml      # Development services
├── .env.docker                 # Environment template
├── docker/
│   ├── start-dev.sh            # Development startup script
│   ├── deploy-prod.sh          # Production deployment script
│   └── create-client-package.sh # Client package creator
├── nginx/
│   └── nginx.conf              # Reverse proxy configuration
└── frontend/
    └── Dockerfile.dev          # Frontend development container
```

## 🛠️ Development Workflow

### Daily Development

```bash
# Start development environment
npm run docker:dev

# Your workflow:
# 1. Edit code in your IDE
# 2. Changes auto-reload in container
# 3. Test at http://localhost:3000
# 4. Frontend dev server at http://localhost:5173

# View logs
npm run docker:logs

# Stop when done
npm run docker:stop
```

### Development Features

- **Live reload**: Code changes trigger automatic restart
- **Debug support**: Node.js debugging on port 9229
- **Frontend integration**: Vite dev server with hot reload
- **Volume mounts**: Your local code is live-mounted
- **Development tools**: vim, nano, htop pre-installed

## 🏭 Production Deployment

### Local Production Testing

```bash
# Test production build locally
npm run docker:prod

# Verify deployment
curl http://localhost:3000/health
curl http://localhost:3000/diag
```

### VPS/Cloud Deployment

```bash
# On your server:
git clone https://github.com/yourusername/ProspectPro.git
cd ProspectPro

# Configure environment
cp .env.docker .env
# Edit .env with your API keys

# Deploy
./docker/deploy-prod.sh

# Application running at http://your-server:3000
```

### Production Features

- **Health checks**: Automatic container health monitoring
- **Security**: Non-root user, minimal attack surface
- **Resource limits**: Memory and CPU controls
- **Auto-restart**: Container restarts on failure
- **Log management**: Persistent logs in ./logs directory

## 📦 Client Distribution

### Creating Client Packages

```bash
# Generate deployment package
npm run docker:package

# Output: prospectpro-deploy-v3.0.0-YYYYMMDD-HHMMSS.tar.gz
```

### Client Installation Process

```bash
# Client receives package and:
tar -xzf prospectpro-deploy-v3.0.0-*.tar.gz
cd prospectpro-deploy-v3.0.0-*

# Interactive setup
./setup.sh

# Start application
./start.sh

# ProspectPro running at http://localhost:3000
```

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Essential Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_secret_key_here
GOOGLE_PLACES_API_KEY=your_google_key_here
FOURSQUARE_API_KEY=your_foursquare_key_here
HUNTER_IO_API_KEY=your_hunter_key_here
NEVERBOUNCE_API_KEY=your_neverbounce_key_here

# Application Settings
NODE_ENV=production
PORT=3000
ALLOW_DEGRADED_START=true
PERSONAL_ACCESS_TOKEN=secure_admin_token
```

### Docker Compose Profiles

```bash
# Include Nginx reverse proxy
docker-compose --profile with-nginx up -d

# Include frontend development server
docker-compose -f docker-compose.dev.yml --profile with-frontend up -d

# Include local PostgreSQL for development
docker-compose -f docker-compose.dev.yml --profile with-local-db up -d
```

## 🔧 Advanced Configuration

### SSL/HTTPS Setup

1. Update `nginx/nginx.conf` with your domain
2. Add SSL certificates to `nginx/ssl/`
3. Start with Nginx profile: `docker-compose --profile with-nginx up -d`

### Custom Resource Limits

```yaml
# Add to docker-compose.yml service:
deploy:
  resources:
    limits:
      memory: 512M
      cpus: "0.5"
    reservations:
      memory: 256M
      cpus: "0.25"
```

### Environment-Specific Overrides

```bash
# Create docker-compose.staging.yml
version: '3.8'
services:
  prospectpro:
    environment:
      - NODE_ENV=staging
      - DEBUG=prospectpro:*

# Deploy staging
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

## 📊 Monitoring & Maintenance

### Health Monitoring

```bash
# Check container status
docker-compose ps

# View application logs
docker-compose logs -f prospectpro

# Check resource usage
docker stats prospectpro_prospectpro_1

# Application health endpoint
curl http://localhost:3000/health
```

### Container Management

```bash
# Restart services
npm run docker:restart

# Rebuild and restart
docker-compose up -d --build

# Stop all services
npm run docker:stop

# Remove containers and volumes
docker-compose down -v
```

### Updates and Rollbacks

```bash
# Update application
git pull origin main
docker-compose up -d --build

# Rollback to previous version
git checkout previous-commit
docker-compose up -d --build
```

## 🚨 Troubleshooting

### Common Issues

**Container won't start**

```bash
# Check logs for errors
docker-compose logs prospectpro

# Check environment configuration
docker-compose exec prospectpro env | grep SUPABASE
```

**API errors**

```bash
# Access container shell
docker-compose exec prospectpro sh

# Test API connections
curl http://localhost:3000/health
curl http://localhost:3000/diag
```

**Performance issues**

```bash
# Check resource usage
docker stats --no-stream

# View container processes
docker-compose exec prospectpro top
```

**Database connection issues**

```bash
# Test Supabase connection
docker-compose exec prospectpro node -e "
const { testConnection } = require('./config/supabase.js');
testConnection().then(console.log);
"
```

### Recovery Procedures

**Backup persistent data**

```bash
# Create backup
docker run --rm -v prospectpro_data:/data -v $(pwd):/backup ubuntu \
  tar czf /backup/prospectpro-backup-$(date +%Y%m%d).tar.gz /data
```

**Restore from backup**

```bash
# Restore data
docker run --rm -v prospectpro_data:/data -v $(pwd):/backup ubuntu \
  tar xzf /backup/prospectpro-backup-YYYYMMDD.tar.gz -C /
```

## 📈 Performance Optimization

### Container Optimization

- Multi-stage builds for smaller images
- .dockerignore to exclude unnecessary files
- Layer caching optimization
- Non-root user for security

### Application Optimization

- Health checks for automatic recovery
- Resource limits to prevent resource exhaustion
- Log rotation and management
- Connection pooling and caching

## 🎯 Best Practices

1. **Always use .env files** - Never hardcode secrets
2. **Test locally first** - Use development environment for testing
3. **Monitor resource usage** - Set appropriate limits
4. **Regular backups** - Backup persistent data regularly
5. **Security updates** - Keep base images updated
6. **Log management** - Monitor and rotate logs
7. **Health monitoring** - Use health check endpoints

## 📞 Support

For issues or questions:

1. Check logs: `npm run docker:logs`
2. Verify configuration: Check .env file
3. Test connectivity: `curl http://localhost:3000/health`
4. Review this guide for troubleshooting steps

---

**🚀 ProspectPro Docker System v3.0.0**  
**Professional deployment made simple**
