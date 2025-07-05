FROM node:18-bullseye-slim

# Install dependencies
WORKDIR /app
COPY package.json ./
RUN npm install

# Copy code + resume
COPY . .

# Puppeteer deps
RUN apt-get update && \
    apt-get install -yq \
      gconf-service libasound2 libatk1.0-0 libc6 \
      libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 \
      libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
      libgtk-3-0 libnspr4 libpango-1.0-0 libx11-6 libx11-xcb1 \
      libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 \
      libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates \
      fonts-liberation libnss3 lsb-release xdg-utils wget && \
    rm -rf /var/lib/apt/lists/*

# Expose port (optional for webhooks)
EXPOSE 8443

CMD ["node", "index.js"]
