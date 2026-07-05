# Stage 1: Dependency builder
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
# Install only production dependencies
RUN npm ci --only=production

# Stage 2: Final runner image
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Copy source code
COPY src ./src

# Set production env
ENV NODE_ENV=production
ENV PORT=5000

# Run as non-root user 'node'
USER node

EXPOSE 5000

CMD ["node", "src/server.js"]
