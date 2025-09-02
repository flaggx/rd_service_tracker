# Use Node 18 LTS for backend
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists) and install dependencies
COPY package*.json ./
RUN npm install

# Copy all backend source files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port (matches .env PORT)
EXPOSE 3001

# Run migrations on start, then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/app.js"]