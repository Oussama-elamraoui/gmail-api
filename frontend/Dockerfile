# Use a Node.js image for building
FROM node:20.15 AS build

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application and build
COPY . .
RUN npm run build

# Use Nginx to serve the built files
FROM nginx:1.23.3

# Copy the build output to Nginx's HTML directory
COPY --from=build /usr/src/app/build /usr/share/nginx/html

# Expose the frontend port
EXPOSE 3000

# Run Nginx
CMD ["nginx", "-g", "daemon off;"]
