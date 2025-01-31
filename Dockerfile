# ---- Base Image ----
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files first for efficient caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile

# Copy rest of the application files
COPY . .

# Build the application (adjust if needed)
RUN pnpm run build

# ---- Final Image ----
FROM node:20-alpine

WORKDIR /app

# Install pnpm again for runtime
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Set a non-root user (optional, but recommended for security)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the app's port (adjust if needed)
EXPOSE 4000

# Start the application
CMD ["pnpm", "start"]
