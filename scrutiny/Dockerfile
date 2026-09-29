# GST Intelligence production image
# Stage 1 builds the data (from ./data workbooks) and the web app; stage 2 runs server.mjs.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
# Chromium + fonts for server-side PDF export of scrutiny reports (₹ glyph included in Noto).
RUN apk add --no-cache chromium font-noto ttf-dejavu tini
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    CHROME_PATH=/usr/bin/chromium-browser \
    CHROME_NO_SANDBOX=1
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
# Engine + workbooks so uploads can be saved and data.json rebuilt at runtime (scripts/data-store.js)
COPY --from=build /app/src/engine ./src/engine
COPY --from=build /app/node_modules/xlsx ./node_modules/xlsx
COPY --from=build /app/data ./data
# Shared case record (event log); mounted as a volume in docker-compose.yml
RUN mkdir -p store
# Seed the report library (a named volume copies this on first start)
COPY --from=build /app/public/reports ./public/reports
COPY server.mjs package.json ./
RUN chown -R node:node /app
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/__ai/status >/dev/null || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "node scripts/build-data.mjs && exec node server.mjs"]
