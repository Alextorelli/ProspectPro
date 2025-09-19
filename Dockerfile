FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install runtime dependencies only
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Drop privileges to non-root user for security
USER node

# Expose port (Railway will override this)
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]