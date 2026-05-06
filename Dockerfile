FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY server.mjs ./
COPY game.html mapmaker.html mapData.game.json ./
COPY assets ./assets
COPY data ./data
COPY docs ./docs
COPY src ./src
COPY styles ./styles

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5173

EXPOSE 5173

CMD ["npm", "start"]
