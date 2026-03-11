# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only the necessary build outputs from the builder stage
COPY --from=builder /app/.output ./.output

# Expose the port
EXPOSE 3000

# Use a non-root user for security
USER node

# Start the application
CMD ["node", ".output/server/index.mjs"]
