# ---------- Stage 1: Builder ----------
FROM node:20-slim AS builder

# Set working dir
WORKDIR /app

# Copy package files FIRST to leverage Docker layer cache
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --production

# Copy source (app code + scripts + cron config)
COPY . .

# ---------- Stage 2: Runtime ----------
FROM node:20-slim AS runtime

# Ensure noninteractive apt
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Install system dependencies: cron, tzdata, ca-certificates
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       cron \
       tzdata \
       ca-certificates \
  && ln -snf /usr/share/zoneinfo/UTC /etc/localtime \
  && echo "UTC" > /etc/timezone \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Create runtime directories and set permissions
RUN mkdir -p /app /data /cron \
  && chmod 755 /app /data /cron

WORKDIR /app

# Copy installed node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code and scripts and cron config
COPY --from=builder /app ./

# Install any post-copy production dependencies if needed (optional)
# RUN npm ci --only=production

# Place cron file in /etc/cron.d and set proper permissions (LF should be preserved from source file)
# We will copy the cron file that you placed at ./cron/totp.cron
RUN cp /app/cron/totp.cron /etc/cron.d/totp \
    && chmod 0644 /etc/cron.d/totp \
    && crontab /etc/cron.d/totp

# Ensure the generate script is executable (if using sh wrapper)
RUN chmod +x /app/scripts/generate_totp.js || true
RUN chmod +x /app/entrypoint.sh || true

# Expose configured port
EXPOSE 8080

# Create anonymous volumes (mount points)
VOLUME [ "/data", "/cron" ]

# Use a small healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "require('fs').existsSync('/app/app.js') ? process.exit(0) : process.exit(1)"

# Start cron and the node app with entrypoint script
ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
