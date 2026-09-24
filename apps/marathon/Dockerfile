# Use Nginx to serve the React application
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy the build output to the Nginx html directory
COPY dist/apps/marathon/ /usr/share/nginx/html

# Copy custom Nginx configuration
COPY apps/marathon/deploy/default.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]