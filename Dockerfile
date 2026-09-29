# Maha GST Intelligence platform with GST Scrutiny: one image, one port.
#   docker compose -f docker-compose.platform.yml up -d --build   ->  http://localhost:8080
# The platform is served at "/", GST Scrutiny at "/scrutiny/", by scrutiny/server.mjs.
# (The separate GST Intelligence engine under backend/ and frontend/ has its own docker-compose.yml.)

# ---- the platform (static) ----
FROM node:22-alpine AS platform
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js tailwind.config.js postcss.config.js ./
COPY src ./src
RUN npx vite build

# ---- GST Scrutiny, built to live under /scrutiny/ ----
FROM node:22-alpine AS scrutiny
WORKDIR /app
COPY scrutiny/package.json scrutiny/package-lock.json ./
RUN npm ci
COPY scrutiny/ ./
RUN npm run build:platform

# ---- runtime: scrutiny/server.mjs serves both ----
FROM node:22-alpine
# Chromium + fonts for server-side PDF export of scrutiny reports (₹ glyph included in Noto).
RUN apk add --no-cache chromium font-noto ttf-dejavu tini
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    PLATFORM_DIST=/app/platform \
    SCRUTINY_BASE=/scrutiny/ \
    CHROME_PATH=/usr/bin/chromium-browser \
    CHROME_NO_SANDBOX=1
WORKDIR /app
COPY --from=platform /app/dist ./platform
COPY --from=scrutiny /app/dist ./dist
COPY --from=scrutiny /app/scripts ./scripts
# Engine + workbooks so uploads can be saved and data.json rebuilt at runtime (scrutiny/scripts/data-store.js)
COPY --from=scrutiny /app/src/engine ./src/engine
COPY --from=scrutiny /app/node_modules/xlsx ./node_modules/xlsx
# Synthetic workbooks and registers from the repo; real returns are added on the server (see README).
COPY --from=scrutiny /app/data ./data
RUN mkdir -p store public/reports
COPY scrutiny/server.mjs scrutiny/package.json ./
RUN chown -R node:node /app
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/__ai/status >/dev/null || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "node scripts/build-data.mjs && exec node server.mjs"]
