# Stage 1: Build React app with Node 22 (required by Vite 7+)
FROM node:22 AS build
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) and install dependencies
COPY package*.json ./
RUN npm install

# Copy all frontend source files
COPY . .

# Build React app (Vite) for production
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy build output from previous stage
COPY --from=build /app/dist /usr/share/nginx/html
# Use custom Nginx config for /api proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
