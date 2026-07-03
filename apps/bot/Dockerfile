FROM node:22.22.3-trixie-slim
WORKDIR /app
# Root package files
COPY package*.json ./
COPY turbo.json ./
# Shared packages
COPY packages ./packages
COPY prisma ./prisma
# App files
COPY apps/bot ./apps/bot
RUN npm ci
RUN rm -rf apps/bot/dist && npm run build --filter=bot
COPY apps/bot/assets ./apps/bot/assets
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser
USER appuser
CMD ["node", "apps/bot/dist/shard.js"]
