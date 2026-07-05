# Stage 1: Build React App
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Support running Nginx as non-root user
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d

USER nginx

# Default Nginx port is 80 (need to run as non-root, Nginx configuration supports this if started as non-root on port > 1024, but alpine default nginx config allows it if running as non-root since we changed ownership). In k8s we will run on port 80 or 8080.
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
