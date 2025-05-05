# 1. Use small official Node image
FROM node:18-alpine

# 2. Create app dir
WORKDIR /usr/src/app

# 3. Copy package files and install deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 4. Copy source code
COPY src/ ./src/

# 5. Expose port and set env default
ENV PORT=3000
EXPOSE 3000

# 6. Start the service
CMD ["node", "src/index.js"]
