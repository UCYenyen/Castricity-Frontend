# syntax=docker/dockerfile:1.7

# ---------- deps ----------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# ---------- builder ----------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---------- runner ----------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Overlay full node_modules so the Prisma engine + generated client (placed in
# pnpm's virtual store under .pnpm/) are present at runtime. Next standalone
# tracing alone misses them with Prisma 7 + pnpm.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
