# relay-web — TanStack Start (Vite + nitro) SSR app.
# Multi-stage: build the nitro output, then run it on a slim node image.
FROM node:22-alpine AS build
WORKDIR /app

# VITE_ vars must be present at build time (they're inlined into the client bundle).
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/.output ./.output
EXPOSE 3000
# nitro node-server entry produced by `vite build`.
CMD ["node", ".output/server/index.mjs"]
