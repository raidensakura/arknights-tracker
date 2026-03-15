FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
