FROM node:18-alpine AS fe-builder
ARG ENV
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY src ./src
COPY public ./public
COPY .env.${ENV} .env.production
COPY tsconfig.json tsconfig.node.json vite.config.ts index.html CHANGELOG.md ./
RUN npm run build

FROM node:18-alpine
ARG ENV
COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/index.js ./
COPY .env.${ENV} .env
COPY --from=fe-builder /app/dist/index.html ./

RUN mkdir public
COPY --from=fe-builder /app/dist public/
RUN rm public/index.html

EXPOSE 8080

CMD ["node", "index.js"]