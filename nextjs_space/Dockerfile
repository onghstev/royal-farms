# ============================================
# Royal Farms Poultry Management System
# Multi-stage Docker build for Next.js 14
# ============================================

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files (yarn.lock may be a symlink in repo, so we skip it)
COPY package.json ./
COPY prisma ./prisma/

# Remove hardcoded Prisma output path (environment-specific)
RUN sed -i '/output = /d' prisma/schema.prisma

# Install dependencies (without frozen lockfile since yarn.lock is a symlink in repo)
RUN yarn install --production=false

# Generate Prisma client
RUN npx prisma generate

# Stage 2: Build the application
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Remove hardcoded Prisma output path again (copied fresh from source)
RUN sed -i '/output = /d' prisma/schema.prisma

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_OUTPUT_MODE=standalone

# Build the Next.js app
RUN npx prisma generate && yarn build

# Stage 3: Production runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl curl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets from builder
# Note: outputFileTracingRoot in next.config.js nests standalone output under /app/
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone/app ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files for runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
