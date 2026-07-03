FROM node:22.22.3-trixie-slim
WORKDIR /app
# Root package files
COPY package*.json ./
COPY turbo.json ./
# Shared packages
COPY packages ./packages
COPY prisma ./prisma
# App files
COPY apps/api ./apps/api
RUN npm ci
RUN npm run build --filter=api
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser
USER appuser
EXPOSE 3001
CMD ["npm", "run", "start:prod", "--filter=api"]
