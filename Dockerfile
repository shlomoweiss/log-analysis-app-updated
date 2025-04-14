# Use Node.js 20 as the base image for the frontend
FROM node:20-alpine as frontend-build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source code
COPY frontend/ ./

# Build the frontend application
RUN npm run build

# Use Node.js 20 as the base image for the backend
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend source code
COPY backend/ ./

# Copy built frontend from the frontend-build stage
COPY --from=frontend-build /app/dist /app/public

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the application
CMD ["node", "src/app.js"]
