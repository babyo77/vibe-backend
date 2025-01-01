# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the rest of the application files
COPY . .

# Install dependencies
RUN npm install

# Build the TypeScript code
RUN npm run build

# Remove unnecessary files after build
RUN rm -rf node_modules src

# Expose the port on which the app will run
EXPOSE 4000

# Command to start the app
CMD [ "npm", "start" ]