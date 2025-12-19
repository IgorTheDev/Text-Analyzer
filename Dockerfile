# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including dev dependencies for building)
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Verify build output
RUN ls -la dist/ || echo "dist directory not found"
RUN ls -la dist/public/ 2>/dev/null || echo "dist/public directory not found"

# Copy client public assets (manifest, favicon, etc.)
RUN cp -r client/public/* dist/public/ 2>/dev/null || echo "Client public files not found, continuing..."

# Install tsx globally for dev mode
RUN npm install -g tsx

# Remove dev dependencies to reduce image size only in production
RUN if [ "$NODE_ENV" = "production" ]; then npm prune --production; fi

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]
