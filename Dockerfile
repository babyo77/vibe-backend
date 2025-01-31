# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN corepack enable && pnpm install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Build the TypeScript project
RUN pnpm run build

# Expose port 4000
EXPOSE 4000

# Command to run the application
CMD ["node", "start"]
