# Build Vite React app
FROM node:20-alpine AS build

WORKDIR /app

# Copy package lock and config
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .
RUN npm run build

# Serve build via Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
