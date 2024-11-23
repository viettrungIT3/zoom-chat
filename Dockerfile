# Use official Node.js image
FROM node:latest

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY src/package*.json ./

# Install dependencies
RUN npm install

# Copy source code to container
COPY src .

# Expose port
EXPOSE ${PORT}

# Run application
CMD ["npm", "start"]
