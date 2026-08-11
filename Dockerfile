# ═══════════════════════════════════════════════════════════════════════════════
#  kunga-basics — Dockerfile
#  Multi-stage build: Vite production bundle → nginx static server
# ═══════════════════════════════════════════════════════════════════════════════

# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL is injected at build time via docker-compose build args.
# In Docker the nginx proxy handles /api → kunga-api:3001,
# so the default /api/v1 works without any change to the JS bundle.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ─── Stage 2: Serve with nginx ────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
