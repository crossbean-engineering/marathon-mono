# ---- deps stage: install production node_modules only ----
FROM node:22-alpine AS deps

WORKDIR /app

# Only the generated package.json is needed to resolve runtime deps.
COPY dist/apps/marathon-api/package.json ./package.json

# Install production dependencies plus the runtime deps the webpack bundle
# externalizes / dynamically requires but Nx does not list in the generated
# package.json:
#   - pg     : the PostgreSQL driver used by @prisma/adapter-pg
#   - cors   : externalized by webpack, not always listed
#   - prisma : the CLI, needed for `prisma migrate deploy` at container start
#
# NOTE: prisma is pinned to the exact version the generated client was built
# against (matches @prisma/client). A floating "prisma@7" drifts to the latest
# 7.x on rebuild, mismatching the bundled runtime -> "PrismaClient is not a
# constructor".
#
# --omit=dev + cache clean keep this layer lean (no dev deps, no npm cache).
RUN npm install --legacy-peer-deps --omit=dev --no-audit --no-fund \
      pg cors@2.8.5 prisma@7.8.0 \
 && npm cache clean --force

# ---- runtime stage ----
FROM node:22-alpine AS runtime

ARG COMMIT_SHA=unset

ENV HOST=0.0.0.0
ENV PORT=8085
ENV NODE_ENV=production
ENV COMMIT_SHA=$COMMIT_SHA

WORKDIR /app

RUN addgroup --system marathon-api && \
    adduser --system -G marathon-api marathon-api

# Copy deps and app artifacts already owned by the runtime user. Using
# `COPY --chown` (instead of a later `RUN chown -R`) avoids duplicating every
# file into an extra layer, which nearly doubles the image size.
COPY --chown=marathon-api:marathon-api --from=deps /app/node_modules ./node_modules
COPY --chown=marathon-api:marathon-api dist/apps/marathon-api/ ./

USER marathon-api

# Apply pending migrations, then start the API (which also boots the Bull worker).
CMD ["sh", "-c", "npx prisma migrate deploy --schema ./prisma && node main.js"]
