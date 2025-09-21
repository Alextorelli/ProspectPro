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
ENV PORT=3000
ENV HOST=0.0.0.0

# Drop privileges to non-root user for security
USER node

# Expose port (Railway will override this)
EXPOSE 3000

# Container healthcheck against /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "server.js"]