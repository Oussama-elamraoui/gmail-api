# **Project Overview**

This project consists of a **frontend** and a **backend** that together implement a **Google OAuth authentication flow** using **HTTP-only cookies** to manage and secure access tokens. The frontend, built with **React**, allows users to authenticate with their Google account and select emails from their Gmail account. The backend, built with **Express.js**, handles the OAuth flow and validates the user's access token.

## **Technologies Used**
- **Frontend**: React, JavaScript (ES6), React Router, Axios, Environment Variables
- **Backend**: Express.js, Google OAuth 2.0 API, dotenv, CORS, Cookies (HTTP-only)
- **Containerization**: Docker, Docker Compose
- **Web Server**: NGINX (used for reverse proxying requests to the frontend and backend)

---

## **How the Authentication Flow Works**

1. **Frontend** initiates the OAuth 2.0 flow by redirecting the user to Google's authentication page.
2. After successful authentication, Google redirects back to the **frontend** with an authorization code.
3. The **frontend** sends the authorization code to the **backend** (Express server).
4. The **backend** exchanges the code for an access token and stores it in an **HTTP-only cookie**.
5. The **frontend** can then call backend APIs securely, and the backend will read the access token from the cookie to authenticate requests.

---

## **Securing APIs with Cookies**

### **Why HTTP-only Cookies?**

- **XSS Protection**: By storing the access token in an HTTP-only cookie, JavaScript on the frontend cannot access it, reducing the risk of **cross-site scripting (XSS)** attacks. Only the server can access this cookie.
  
- **Secure Transmission**: The `secure: true` flag ensures that the cookie is sent only over HTTPS, preventing the token from being exposed over an insecure connection. In production, this ensures that the token is never transmitted in plain text.

### **How the Token is Stored**

1. After the **OAuth flow** completes, the backend receives the authorization code, exchanges it for an access token, and sets the `access_token` as an HTTP-only cookie:
   ```js
   res.cookie('access_token', tokens.access_token, {
       httpOnly: true,
       secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
       sameSite: 'Strict',
       maxAge: tokens.expiry_date - Date.now(),
   });
   ```
2. When frontend sends API requests, the token is automatically included in the cookie (as part of the request headers), and the backend verifies it.

---

## **Environment Variables**

The project uses the `.env` file to store environment-specific variables such as Google OAuth credentials, Gemini API key, and frontend URL. Make sure to rename `.env.example` to `.env` and fill in the necessary details.

Example `.env`:

```
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
REDIRECT_URL=http://localhost:5000/google-callback
GEMINI_API_KEY=your_gemini_api_key
AUTHOR_NAME=your_name
FRONTEND_URL=http://localhost:3000
```

---

## **Dockerizing the Project**

This project uses **Docker** to containerize both the **frontend** and **backend**, as well as **NGINX** to reverse proxy the requests between the frontend and backend.

### **Dockerizing the Backend**

1. Create a `Dockerfile` in the **backend** directory:

```Dockerfile
# Backend Dockerfile

# Use the official Node.js image
FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the backend port (5000)
EXPOSE 5000

# Run the app
CMD ["npm", "start"]
```

2. Add a `.dockerignore` file to avoid unnecessary files:

```
node_modules
npm-debug.log
.env
```

### **Dockerizing the Frontend**

1. Create a `Dockerfile` in the **frontend** directory:

```Dockerfile
# Frontend Dockerfile

# Use the official Node.js image
FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React app for production
RUN npm run build

# Expose the frontend port (3000)
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
```

2. Add a `.dockerignore` file to avoid unnecessary files:

```
node_modules
npm-debug.log
.env
```

### **Docker Compose**

To run both containers (frontend and backend) together, use **Docker Compose**. Create a `docker-compose.yml` file in the root of the project:

```yaml
version: '3'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_CLIENT_ID=${CLIENT_ID}
      - REACT_APP_REDIRECT_URL=${REDIRECT_URL}
      - REACT_APP_FRONTEND_URL=${FRONTEND_URL}
    depends_on:
      - backend
    networks:
      - app-network
  
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - CLIENT_ID=${CLIENT_ID}
      - CLIENT_SECRET=${CLIENT_SECRET}
      - REDIRECT_URL=${REDIRECT_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    networks:
      - app-network

  nginx:
    image: nginx:latest
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - frontend
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### **NGINX Configuration**

Create an `nginx.conf` file to configure NGINX to reverse proxy requests:

```nginx
# NGINX Configuration

server {
    listen 80;

    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://backend:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## **Building and Running the Project with Docker**

1. Build and start the containers:

```bash
docker-compose up --build
```

2. The frontend will be accessible at `http://localhost:3000` and the backend at `http://localhost:5000`.

---

## **Commands Summary**

- To build the containers:

```bash
docker-compose build
```

- To start the containers:

```bash
docker-compose up
```

- To stop the containers:

```bash
docker-compose down
```

- To view the logs:

```bash
docker-compose logs -f
```

---

## **Power of Docker and NGINX**

- **Docker**:
  - Simplifies the process of setting up and running the application in any environment.
  - Ensures consistency across development, staging, and production environments.
  - Eases dependency management and version control.

- **NGINX**:
  - Provides a reverse proxy for the frontend and backend.
  - Improves performance by serving static files efficiently.
  - Enables secure HTTPS connections (when combined with SSL certificates).

---

## **Conclusion**

This project demonstrates how to securely manage Google OAuth authentication with **HTTP-only cookies**, how to use **Docker** to containerize the application, and how **NGINX** can be used to proxy requests between the frontend and backend. By using Docker, you ensure the app runs in a consistent environment across all stages of development and production, while NGINX helps with routing and performance optimization.

