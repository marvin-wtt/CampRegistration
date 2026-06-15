# Camp Registration

A full-stack web application for managing youth camp registrations — customizable
forms, participants, room assignments, program planning, email notifications, and
multi-language content.

## Repository Structure

This is an [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces)
monorepo with four packages:

| Package                   | Description                                                            |
| ------------------------- | --------------------------------------------------------------------- |
| [`common/`](./common)     | Shared TypeScript types, entities, form definitions, and permissions. |
| [`backend/`](./backend)   | Node.js / Express 5 REST API (Prisma, InversifyJS, BullMQ).           |
| [`frontend/`](./frontend) | Vue 3 / Quasar SPA (Pinia, SurveyJS, vue-i18n).                        |
| [`e2e/`](./e2e)           | Cypress end-to-end tests.                                             |

> **Build order matters:** `common` must be built before `backend` and
> `frontend`. The root `build` script handles this for you.

## Prerequisites

- Node.js `>=22 <25`
- npm 10+
- MySQL >= 8.0.1 or MariaDB >= 10.6 (for the backend) — see
  [Local Services](#local-services) for a Docker setup
- Redis 7 — optional, only required when the backend uses `QUEUE_DRIVER=redis`

## Getting Started

1. **Install dependencies** (from the repository root):

   ```bash
   npm install
   ```

2. **Configure environments:**

   ```bash
   cp ./backend/.env.dev ./backend/.env
   cp ./frontend/.env.example ./frontend/.env
   ```

   Adjust the values to match your environment. See each package's README for the
   available options.

3. **Build all workspaces:**

   ```bash
   npm run build
   ```

4. **Set up the database** (after starting the local services below):

   ```bash
   npm run db:migrate --workspace backend
   npm run db:seed --workspace backend
   ```

## Local Services

A Docker Compose file provisions the services the backend depends on (MariaDB,
MailDev, PhpMyAdmin, and Redis):

```bash
docker-compose -f backend/docker-compose.yml --profile dev up -d
```

| Service    | Port                    | Notes                                  |
| ---------- | ----------------------- | -------------------------------------- |
| MariaDB    | 3306                    | Dev database                           |
| MailDev    | 1080 (web), 1025 (SMTP) | Catches outgoing emails                |
| PhpMyAdmin | 8080                    | Database GUI                           |
| Redis      | 6379                    | Optional — only for `QUEUE_DRIVER=redis` |

Integration tests use a separate database on port 3307 (`--profile test`).

## Development

Run the backend and frontend dev servers (in separate terminals):

```bash
npm run dev --workspace backend
npm run dev --workspace frontend
```

## Common Tasks

```bash
# Build everything (common first)
npm run build

# Run all tests
npm run test --workspaces

# Lint and format checks across all workspaces
npm run lint --workspaces --if-present
npm run format:check --workspaces --if-present

# Format all workspaces
npm run format
```

## Production

Build all workspaces and run the database migrations, then start the server
(serves the API and the built frontend):

```bash
npm run build-and-migrate
npm run production
```

## License

Licensed under the [GNU Affero General Public License v3.0](./LICENSE)
(AGPL-3.0-only).
