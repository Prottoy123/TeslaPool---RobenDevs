# Multi-stage Dockerfile for Dhaka Tesla Pool Backend
FROM node:22-alpine AS base

WORKDIR /app

# Install dependencies needed for node-gyp if necessary
RUN apk add --no-cache libc6-compat

# Copy dependency specifications
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose API port
EXPOSE 5000

# Environment defaults
ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["node", "src/server.js"]
