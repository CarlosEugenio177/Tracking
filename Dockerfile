# Multi-stage Dockerfile for pnpm monorepo
FROM node:24-bookworm-slim AS builder

# Install native build tools for dependencies (Debian/Ubuntu style)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install pnpm via npm since corepack is unbundled in newer Node versions
RUN npm install -g pnpm@9

WORKDIR /app

# Copy everything
COPY . .

# Install all dependencies (we don't need --ignore-scripts in Docker since 'sh' is available)
RUN pnpm install

# Set environment variables required by Vite config during build
ENV PORT=5000
ENV BASE_PATH=/
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Build the project
RUN pnpm --filter @workspace/trackflow run build
RUN pnpm --filter @workspace/api-server run build

# Install pnpm via npm
RUN pnpm deploy --filter @workspace/api-server --prod /deploy

# Stage 2: Runner
FROM node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install Chromium for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy the deployed api-server (contains its own node_modules, package.json, and dist)
COPY --from=builder /deploy ./artifacts/api-server

# Copy the built frontend static files
COPY --from=builder /app/artifacts/trackflow/dist ./artifacts/trackflow/dist

EXPOSE 5000
ENV PORT=5000

# Start the API server directly using node
CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
