# Aperture

A media-sharing REST API (a mini-Instagram) — the backend for a photo feed with
users, authentication, posts with image uploads, and likes.

This is a learning project built to practice the skills senior backend roles ask
for: **NestJS, PostgreSQL, Docker, CI/CD, and (later) AWS, Redis, and Kafka.**

---

## Tech stack

| Area       | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | [NestJS 11](https://nestjs.com) (strict TypeScript) |
| Database   | PostgreSQL 16 + [TypeORM](https://typeorm.io) (migrations, not `synchronize`) |
| Auth       | JWT via `@nestjs/passport` + `passport-jwt`        |
| Uploads    | `multer` → local disk (moves to S3 in a later phase) |
| Config     | `@nestjs/config` + Joi validation                  |
| Docs       | Swagger (OpenAPI)                                   |
| Local infra| Docker + Docker Compose                            |

## Features / endpoints

| Method + path                | Auth | Description                          |
| ---------------------------- | ---- | ------------------------------------ |
| `GET /health`                | —    | Liveness check                       |
| `POST /users`                | —    | Register (email + password, bcrypt)  |
| `GET /users/:id`             | —    | Get a user                           |
| `POST /auth/login`           | —    | Log in → returns a JWT               |
| `GET /auth/me`               | ✅   | Current user from the JWT            |
| `POST /posts`                | ✅   | Create a post with an image upload   |
| `GET /posts`                 | —    | Feed of posts                        |
| `GET /posts/:id`             | —    | A single post                        |
| `POST /posts/:postId/likes`  | ✅   | Like a post (idempotent)             |
| `DELETE /posts/:postId/likes`| ✅   | Unlike a post                        |

Interactive API docs: **http://localhost:3000/api-docs**

---

## Getting started

You only need **Docker Desktop** installed. Everything (the database, migrations,
and the app) runs in containers — no local Node or Postgres setup required to run.

### 1. Clone and configure

```bash
git clone https://github.com/Archil-Milorava/aperture.git
cd aperture
cp .env.example .env      # then open .env and set real values (JWT_SECRET must be ≥16 chars)
```

### 2. Start everything with one command

```bash
npm run start:dev
```

That builds the image on first run, starts PostgreSQL, applies database
migrations, then starts the app **with hot reload** — edit any file in `src/` and
it recompiles automatically. Wait for the log line:

```
🚀 aperture is running on http://localhost:3000
```

### 3. Open it

| What              | URL                                             |
| ----------------- | ----------------------------------------------- |
| API               | http://localhost:3000                           |
| Swagger docs      | http://localhost:3000/api-docs                  |
| Health check      | http://localhost:3000/health                    |
| Adminer (DB UI)   | http://localhost:8080                           |

To log into Adminer: **System** = PostgreSQL, **Server** = `postgres` (the
service name, not `localhost`), and the user / password / database from your
`.env`.

Stop everything with `Ctrl+C`, or from another terminal:

```bash
npm run docker:down
```

---

## Everyday commands

| Command                    | What it does                                                             |
| -------------------------- | ----------------------------------------------------------------------- |
| `npm run start:dev`        | **Daily driver.** Full stack in Docker with hot reload.                 |
| `npm run start:dev:build`  | Same, but rebuilds the image. Use after changing dependencies or the Dockerfile. |
| `npm run docker:up`        | Prod-like run: the compiled image, no hot reload — to test how it runs in production. |
| `npm run docker:down`      | Stop and remove the stack (your database data is kept).                  |
| `npm run lint`             | Lint + auto-fix (runs on your host — needs Node 20).                     |
| `npm run test`             | Run unit tests (host).                                                   |

> **Host tooling & Node 20:** a few commands (`lint`, `test`, `migration:generate`)
> run on your machine rather than in Docker, and they need Node 20. This repo has
> an `.nvmrc`, so run `nvm use` first — or install [Volta](https://volta.sh) to
> switch automatically.

---

## Database & migrations

The schema is owned by **migrations** (never `synchronize`). When you run
`npm run start:dev`, a one-shot `migrate` container applies any pending
migrations before the app starts, so the app never talks to an empty schema.

To create a new migration after changing an entity:

```bash
nvm use                                                     # host Node 20
npm run migration:generate -- src/database/migrations/<Name>  # writes the SQL
# review the generated file, then:
npm run start:dev:build                                     # rebuild + apply on next up
```

Other migration commands: `npm run migration:run`, `npm run migration:revert`.

Browse the database anytime with **Adminer** at http://localhost:8080.

---

## Configuration

All config comes from environment variables (see `.env.example`):

| Variable         | Example              | Notes                                            |
| ---------------- | -------------------- | ------------------------------------------------ |
| `NODE_ENV`       | `development`        | `development` \| `test` \| `production`          |
| `PORT`           | `3000`               | Port the app listens on                          |
| `DB_HOST`        | `localhost`          | `localhost` for host tooling; Docker overrides this to `postgres` |
| `DB_PORT`        | `5432`               |                                                  |
| `DB_USER`        | `aperture`           |                                                  |
| `DB_PASSWORD`    | `change_me`          |                                                  |
| `DB_NAME`        | `aperture`           |                                                  |
| `JWT_SECRET`     | `min_16_characters…` | Required, at least 16 characters                 |
| `JWT_EXPIRES_IN` | `3600`               | Access-token lifetime, in seconds                |

---

## How the dev setup works

- **`docker-compose.yml`** — the base stack: Postgres, Adminer, a one-shot
  `migrate` job, and the app built from the small production image.
- **`docker-compose.dev.yml`** — dev overrides layered on top: the app runs from
  the `builder` stage in watch mode, with `./src` bind-mounted for hot reload.
- **`Dockerfile`** — a multi-stage build (`builder` → `prod-deps` → slim
  non-root `runner`) so the shipped image stays small.

`npm run start:dev` simply combines the two compose files. `npm run docker:up`
uses only the base file, giving you the production-like image.

## Project structure

```
src/
  auth/        JWT login, guard, strategy
  users/       registration
  posts/       posts + image upload
  likes/       idempotent likes
  health/      liveness endpoint
  config/      env validation (Joi)
  database/    TypeORM data source + migrations
```
