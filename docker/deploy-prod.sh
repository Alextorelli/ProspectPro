#!/bin/bash

# ProspectPro Docker Production Deployment Script
# This script deploys ProspectPro for production use

set -e

echo "🚀 ProspectPro Production Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check for environment file
if [ ! -f .env ]; then
    echo -e "${RED}❌ Environment file (.env) not found.${NC}"
    echo -e "${YELLOW}📝 Creating environment template...${NC}"
    cp .env.docker .env
    echo -e "${RED}⚠️  CRITICAL: You must configure .env with your actual API keys before proceeding.${NC}"
    echo -e "${YELLOW}   Edit .env and add your Supabase credentials and API keys.${NC}"
    exit 1
fi

# Validate critical environment variables
echo -e "${BLUE}🔍 Validating environment configuration...${NC}"
source .env

required_vars=("SUPABASE_URL" "SUPABASE_SECRET_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" || "${!var}" == *"your_"* ]]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for var in "${missing_vars[@]}"; do
        echo -e "${RED}   - $var${NC}"
    done
    echo -e "${YELLOW}Please edit .env and add the missing values.${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${GREEN}📁 Creating data directories...${NC}"
mkdir -p logs data uploads config

# Build production container
echo -e "${GREEN}🔨 Building production container...${NC}"
docker-compose build --no-cache

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping any existing containers...${NC}"
docker-compose down 2>/dev/null || true

# Start production environment
echo -e "${GREEN}🚀 Starting production environment...${NC}"
docker-compose up -d

# Wait for application to start
echo -e "${BLUE}⏳ Waiting for application to start...${NC}"
sleep 15

# Health check with retries
echo -e "${GREEN}🏥 Performing health check...${NC}"
max_attempts=6
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f -s http://localhost:3000/health > /dev/null; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
        break
    else
        if [ $attempt -eq $max_attempts ]; then
            echo -e "${RED}❌ Health check failed after $max_attempts attempts${NC}"
            echo -e "${YELLOW}📋 Check logs with: docker-compose logs prospectpro${NC}"
            exit 1
        fi
        echo -e "${YELLOW}⏳ Attempt $attempt/$max_attempts failed, retrying in 10 seconds...${NC}"
        sleep 10
        ((attempt++))
    fi
done

# Comprehensive diagnostics check
echo -e "${BLUE}🔍 Running diagnostics check...${NC}"
diag_response=$(curl -s http://localhost:3000/diag 2>/dev/null || echo "")
if [[ "$diag_response" == *"success"* ]]; then
    echo -e "${GREEN}✅ Diagnostics check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Diagnostics check shows some issues, but application is running${NC}"
fi

# Display deployment status
echo -e "\n${GREEN}📊 Deployment Status:${NC}"
docker-compose ps

echo -e "\n${GREEN}🎉 ProspectPro Production Deployment Complete!${NC}"
echo -e "${GREEN}🌐 Application URL: http://localhost:3000${NC}"
echo -e "${GREEN}📊 Health Check: http://localhost:3000/health${NC}"
echo -e "${GREEN}🔍 Diagnostics: http://localhost:3000/diag${NC}"

echo -e "\n${GREEN}📚 Management Commands:${NC}"
echo -e "  ${GREEN}View logs:${NC} docker-compose logs -f prospectpro"
echo -e "  ${GREEN}Stop application:${NC} docker-compose down"
echo -e "  ${GREEN}Restart:${NC} docker-compose restart"
echo -e "  ${GREEN}Update:${NC} git pull && docker-compose up -d --build"
echo -e "  ${GREEN}Shell access:${NC} docker-compose exec prospectpro sh"

echo -e "\n${GREEN}🔧 Configuration:${NC}"
echo -e "  ${GREEN}Environment file:${NC} .env"
echo -e "  ${GREEN}Logs directory:${NC} ./logs"
echo -e "  ${GREEN}Data directory:${NC} ./data"

echo -e "\n${GREEN}✅ ProspectPro is now running and ready for use!${NC}"