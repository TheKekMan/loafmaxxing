FROM node:20-alpine

# Set environment variables
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Set work directory
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./

# Install dependencies (including devDependencies so we can build)
RUN npm ci

# Copy application source
COPY . .

# Build application
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# Set environment variable to production and prune devDependencies
ENV NODE_ENV=production
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start production server
CMD ["npx", "next", "start", "-p", "3000", "-H", "0.0.0.0"]
