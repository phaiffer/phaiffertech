FROM node:20-alpine AS build
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG NEXT_PUBLIC_DEMO_ASSISTED_ENABLED=false
ENV NEXT_PUBLIC_DEMO_ASSISTED_ENABLED=${NEXT_PUBLIC_DEMO_ASSISTED_ENABLED}

COPY apps/frontend/package.json ./package.json
COPY apps/frontend/package-lock.json ./package-lock.json
RUN npm ci

COPY apps/frontend/. .
RUN test -n "$NEXT_PUBLIC_API_URL"
RUN npm run build

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node

EXPOSE 8080
CMD ["node", "server.js"]