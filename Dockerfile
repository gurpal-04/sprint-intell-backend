# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Stage 2: Production image ----
FROM node:20-alpine

# Security: run as a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only production node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY package.json ./
COPY src ./src

# Switch to non-root user
USER appuser

# Default port (overridable via env)
ENV PORT=5001
EXPOSE 5001

# Health check against the base route
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/ || exit 1

CMD ["node", "src/server.js"]
