FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend only
RUN npm run railway-build

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "run", "railway-start"]
