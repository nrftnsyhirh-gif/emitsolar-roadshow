# Dockerfile — used by Google Cloud Run to build and run your server
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Cloud Run injects the PORT environment variable automatically
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
