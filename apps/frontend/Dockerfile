FROM node:20-alpine AS build
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY apps/frontend/package.json ./package.json
COPY apps/frontend/package-lock.json ./package-lock.json
RUN npm ci

COPY apps/frontend/. .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node

EXPOSE 3000
CMD ["node", "server.js"]
