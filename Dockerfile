# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Installer dumb-init pour gérer les signaux correctement
RUN apk add --no-cache dumb-init

# Installer serve pour servir les fichiers statiques
RUN npm install -g serve

# Copier le build depuis le stage builder
COPY --from=builder /app/build ./build

# Créer un utilisateur non-root pour sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Variables d'env
ENV NODE_ENV=production

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Utiliser dumb-init pour lancer l'app
ENTRYPOINT ["dumb-init", "--"]

# Start the service
CMD ["serve", "-s", "build", "-l", "3000"]
