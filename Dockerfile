FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20
WORKDIR /app
COPY --from=builder /app .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["sh", "-c", "npm run db:push && npm run start"]
