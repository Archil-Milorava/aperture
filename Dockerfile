# syntax=docker/dockerfile:1

# =============================================================================
# Aperture — multi-stage build.
#
# The idea: do the heavy, tool-hungry work (install ALL deps, compile native
# modules, build TypeScript) in throwaway stages, then copy ONLY the compiled
# output + production dependencies into a small final image.
#
# Smaller final image  =  faster deploys, smaller attack surface, less to ship.
# =============================================================================

# ---- Stage 1: builder -------------------------------------------------------
# The FULL Debian-based Node image ships a C/C++ toolchain (needed to compile
# native addons like bcrypt) and lets us install devDependencies (@nestjs/cli,
# ts-node) that are required to BUILD the app and to run migrations.
FROM node:20-bookworm AS builder
WORKDIR /app

# Copy only the manifests first. This layer is cached and `npm ci` re-runs ONLY
# when dependencies actually change — not on every source-code edit.
COPY package*.json ./
RUN npm ci

# Bring in the source and compile TypeScript -> dist/.
COPY . .
RUN npm run build

# ---- Stage 2: prod-deps -----------------------------------------------------
# A clean, PRODUCTION-ONLY node_modules (no devDependencies). Built on the same
# full image so native modules (bcrypt) are compiled against the same glibc and
# Node ABI as the final image below — this is why we don't mix Alpine here.
FROM node:20-bookworm AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Stage 3: runner (final image) ------------------------------------------
# SLIM image: no build tools, no source, no devDeps — just Node + our app.
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy each artifact from the stage that produced it.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder   /app/dist         ./dist
COPY package.json ./

# multer writes uploads here and main.ts serves them from here. Create the dir
# and hand it to the non-root `node` user (uid 1000, ships with the image) so
# the app can still write after we drop root below. When docker-compose mounts
# an empty named volume here, it inherits this ownership.
RUN mkdir -p uploads && chown node:node uploads

# Never run as root inside a container if you don't have to.
USER node

# Documents the port the app listens on (from PORT env, default 3000).
EXPOSE 3000

# Run the compiled app directly with node — no npm wrapper, so signals (e.g.
# docker stop -> SIGTERM) reach Node and it can shut down cleanly.
CMD ["node", "dist/main"]
