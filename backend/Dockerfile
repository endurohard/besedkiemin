FROM node:18-slim AS base
WORKDIR /app

# Dependencies layer (cached separately)
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --production=false && npx prisma generate

# Development
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY . .
CMD ["npx", "nest", "start", "--watch"]

# Production build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx nest build

# Production
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma/
COPY uploads ./uploads/
CMD ["node", "dist/main"]
