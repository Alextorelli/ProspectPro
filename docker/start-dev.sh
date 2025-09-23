#!/bin/bash

# ProspectPro Docker Development Setup Script
# This script sets up the development environment with live reload

set -e

echo "🚀 Setting up ProspectPro Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not available. Please install Docker Compose.${NC}"
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating environment file...${NC}"
    cp .env.docker .env
    echo -e "${YELLOW}⚠️  Please edit .env with your actual API keys before starting the application.${NC}"
    echo -e "${YELLOW}   Required: SUPABASE_URL, SUPABASE_SECRET_KEY, and API keys for external services${NC}"
    
    # Prompt user if they want to edit now
    read -p "Would you like to edit the .env file now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    fi
fi

# Create necessary directories
echo -e "${GREEN}📁 Creating necessary directories...${NC}"
mkdir -p logs data uploads

# Build development containers
echo -e "${GREEN}🔨 Building development containers...${NC}"
docker-compose -f docker-compose.dev.yml build

# Start development environment
echo -e "${GREEN}🚀 Starting development environment...${NC}"
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo -e "${GREEN}⏳ Waiting for services to start...${NC}"
sleep 10

# Health check
echo -e "${GREEN}🏥 Performing health check...${NC}"
if curl -f http://localhost:3000/health &> /dev/null; then
    echo -e "${GREEN}✅ ProspectPro backend is running successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed, but this might be normal during startup.${NC}"
fi

# Display status
echo -e "${GREEN}📊 Development environment status:${NC}"
docker-compose -f docker-compose.dev.yml ps

echo -e "\n${GREEN}🎯 Development Environment Ready!${NC}"
echo -e "${GREEN}📱 Backend API: http://localhost:3000${NC}"
echo -e "${GREEN}🌐 Frontend Dev: http://localhost:5173${NC}"
echo -e "${GREEN}🐛 Debug Port: 9229${NC}"

echo -e "\n${GREEN}📚 Common Commands:${NC}"
echo -e "  ${GREEN}View logs:${NC} docker-compose -f docker-compose.dev.yml logs -f"
echo -e "  ${GREEN}Stop:${NC} docker-compose -f docker-compose.dev.yml down"
echo -e "  ${GREEN}Restart:${NC} docker-compose -f docker-compose.dev.yml restart"
echo -e "  ${GREEN}Shell access:${NC} docker-compose -f docker-compose.dev.yml exec prospectpro-dev sh"

echo -e "\n${GREEN}🔧 Next Steps:${NC}"
echo -e "1. Edit code in your favorite editor - changes will auto-reload"
echo -e "2. Test API endpoints: curl http://localhost:3000/health"
echo -e "3. Access frontend at: http://localhost:5173"
echo -e "4. View logs: docker-compose -f docker-compose.dev.yml logs -f prospectpro-dev"

echo -e "\n${GREEN}🚀 Happy coding!${NC}"