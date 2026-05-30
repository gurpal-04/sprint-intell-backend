# ---- Stage 1: Install dependencies ----
FROM node:20-slim AS deps

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Stage 2: Production image ----
FROM ubuntu:24.04

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies (curl, ca-certificates, gnupg, and Node.js 20 via NodeSource)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Coral CLI
ENV CORAL_INSTALL_DIR=/usr/local/bin
RUN curl -fsSL https://withcoral.com/install.sh | sh

# Security: run as a non-root user
RUN groupadd --system appgroup && useradd --system --create-home --gid appgroup appuser

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
  CMD curl -f http://localhost:5001/ || exit 1

CMD ["node", "src/server.js"]
