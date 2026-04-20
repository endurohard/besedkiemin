FROM node:18-alpine AS base
WORKDIR /app

# Dependencies layer (cached)
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production with express server
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY server.cjs ./
EXPOSE 5173
CMD ["node", "server.cjs"]
