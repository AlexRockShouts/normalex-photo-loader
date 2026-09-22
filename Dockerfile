# ---- Stage 1: Client bauen ----
FROM node:20-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- Stage 2: Server + gebauter Client ----
FROM node:20-alpine
WORKDIR /app/server
ENV NODE_ENV=production

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/src ./src
COPY --from=client /app/client/dist /app/client/dist

# Verzeichnis fuer Uploads (Server erstellt es bei Start, hier zur Sicherheit)
RUN mkdir -p /app/server/uploads

EXPOSE 3000
CMD ["node", "src/index.js"]
