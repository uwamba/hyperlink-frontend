
FROM node:18

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app
# Copy package.json and lock file first
COPY package*.json ./
RUN pnpm install

COPY . .
EXPOSE 3000


CMD ["pnpm", "dev"]

