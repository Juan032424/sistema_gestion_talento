# Server Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies first for better caching
COPY package*.json ./

RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the API port
EXPOSE 3001

# Run the application
CMD ["node", "index.js"]
