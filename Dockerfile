# Production image for self-hosting (Coolify). Builds the standalone server
# from next.config.ts and runs it as an unprivileged user on port 3000.
# Secrets are runtime environment variables, never build arguments.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
# DATA_DIR holds the shared game (state.json). Mount a persistent volume there
# in Coolify so a redeploy during the party does not reset the quiz.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/app/data
RUN addgroup -S app && adduser -S app -G app \
 && mkdir -p /app/data /app/.next/cache \
 && chown -R app:app /app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
# The team photos, read from disk by the photo route and never served directly.
COPY --from=build --chown=app:app /app/private ./private
USER app
EXPOSE 3000
CMD ["node", "server.js"]
