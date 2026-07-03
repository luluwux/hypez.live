FROM node:22.22.3-trixie-slim AS builder
ARG APP
WORKDIR /app
COPY package*.json ./
COPY turbo.json ./
COPY packages ./packages
COPY prisma ./prisma
COPY apps/api ./apps/api
COPY apps/bot ./apps/bot
RUN npm install --no-fund --no-audit
RUN npm install @napi-rs/canvas-linux-x64-gnu --no-save
RUN npx prisma generate
RUN cd packages/shared-types && npm run build
RUN cd apps/${APP} && npm run build
RUN mkdir -p /app/apps/${APP}/assets

FROM node:22.22.3-trixie-slim AS runner
ARG APP
ENV APP=${APP}
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl fontconfig fonts-liberation fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/apps/${APP}/dist ./apps/${APP}/dist
COPY --from=builder /app/apps/${APP}/package*.json ./apps/${APP}/
COPY --from=builder /app/apps/${APP}/assets ./apps/${APP}/assets
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/prisma ./prisma
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser
USER appuser
CMD ["sh", "-c", "node apps/${APP}/dist/main.js"]
