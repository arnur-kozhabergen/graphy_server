FROM node:24.22.1-alpine@sha256:1200d815de24f8dcca745fbf7651d166034a35adbcad8860a8538ffff44f1420 AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:24.22.1-alpine@sha256:1200d815de24f8dcca745fbf7651d166034a35adbcad8860a8538ffff44f1420 AS runtime
ENV NODE_ENV=production
WORKDIR /app
# The running service needs node, not the vulnerable package-manager toolchain.
RUN rm -rf /usr/local/lib/node_modules /opt/yarn* \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node graphserver.js UScities.json ./
USER node
EXPOSE 4000
CMD ["node", "graphserver.js"]

