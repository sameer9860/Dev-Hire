FROM node:20-alpine

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Expose Next.js default port
EXPOSE 3000

# Start dev server
CMD ["npm", "run", "dev"]
