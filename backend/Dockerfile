# Use a Node.js image
FROM node:20.15

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the backend port
EXPOSE 5000

# Use the `.env` file
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Command to run the backend
CMD ["node", "index.js"]
