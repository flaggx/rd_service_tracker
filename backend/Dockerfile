# Use Node 18 LTS for backend
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists) and install dependencies
COPY package*.json ./
RUN npm install

# Copy all backend source files
COPY . .

# Expose port (matches .env PORT)
EXPOSE 3001

# Run backend server
CMD ["node", "src/app.js"]
