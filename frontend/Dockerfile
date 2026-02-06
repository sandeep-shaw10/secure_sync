# 👇 CHANGE THIS LINE (Was node:18-alpine)
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Start the app
CMD ["npm", "start"]