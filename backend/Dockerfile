FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache sqlite

COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

RUN npm ci
RUN npm run build

EXPOSE 8444

CMD ["node", "dist/index.js"]