# Frontend builder image: builds the Vite app
FROM node:22-alpine

WORKDIR /app

# Install deps using a clean install for reproducibility
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
# default command can be overridden by Compose
CMD ["npm", "run", "build"]