FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install runtime dependencies only (fallback if no lockfile)
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy application code
COPY . .

# Create writable upload dir and install curl for healthchecks
RUN mkdir -p uploads \
    && chown -R node:node /app/uploads \
    && apk add --no-cache curl

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV ALLOW_DEGRADED_START=true
# Note: PORT will be provided by Cloud Run dynamically

# Drop privileges to non-root user for security
USER node

# Cloud Run manages ports dynamically, no fixed EXPOSE needed
# EXPOSE directive removed to let Cloud Run handle port mapping

# Enhanced healthcheck for Cloud Run with fallback
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -fsS http://localhost:${PORT:-8080}/health || \
    curl -fsS http://localhost:8080/health || \
    curl -fsS http://localhost:3100/health || \
    exit 1

# Start the application
CMD ["node", "server.js"]