# ── Stage 1: Install all dependencies ────────────────────────────────────────
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Stage 2: Build Vite frontend ─────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN npm run build

# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy dependencies (includes tsx for running TypeScript server)
COPY --from=deps /app/node_modules ./node_modules

# Copy built frontend assets
COPY --from=builder /app/dist ./dist

# Copy server source
COPY server ./server

# Copy shared source files referenced by the server
COPY src/lib ./src/lib
COPY src/types ./src/types

# Copy package.json (needed for ESM "type": "module")
COPY package.json ./

EXPOSE 8080

CMD ["node_modules/.bin/tsx", "server/index.ts"]
