FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache sqlite

COPY package*.json ./
COPY tsconfig.json ./

COPY dist ./dist

RUN npm ci --only=production

EXPOSE 8444

CMD ["node", "dist/index.js"]