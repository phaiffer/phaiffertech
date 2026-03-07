FROM node:20-alpine AS build
WORKDIR /app

COPY apps/frontend/package.json ./package.json
COPY apps/frontend/package-lock.json ./package-lock.json
RUN npm ci

COPY apps/frontend/. .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node

EXPOSE 3000
CMD ["node", "server.js"]
