FROM node:latest

WORKDIR /var/www/

# Install dependencies
COPY ./package.json ./
RUN npm install --no-audit --no-package-lock

# Build javascript code
COPY ./ ./
RUN npm run build

# Host server
CMD cd /var/www/ && npm run run