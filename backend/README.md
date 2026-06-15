# Camp Registration Backend

`@camp-registration/api` — a RESTful API service that powers the Camp Registration
system. It provides endpoints for managing camps, registrations, participants,
room assignments, users, files, and email notifications.

## Technologies

- **Node.js** v22+ with **TypeScript** (ESM)
- **Express 5** — web framework
- **Prisma ORM** — database access and migrations (MySQL / MariaDB)
- **InversifyJS** — dependency injection
- **BullMQ** — background job queue (Redis-backed)
- **Passport.js** + JWT — authentication, with TOTP 2FA
- **Zod** — schema validation
- **Nodemailer** + **MJML** — email sending and templating
- **Winston** — logging
- **Vitest** + **Supertest** — testing

## Prerequisites

- Node.js `>=22`
- MySQL >= 8.0.1 or MariaDB >= 10.6
- Redis 7 — optional, only required when `QUEUE_DRIVER=redis`

The easiest way to get the database, a dev mail server (and optionally Redis)
running is the Docker Compose setup documented in the
[root README](../README.md#local-services).

## Setup

1. Install dependencies (preferably from the repository root so the workspace is
   linked):

   ```bash
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.dev .env
   ```

   Update the database connection string and other values to match your
   environment.

3. Build the [`common`](../common) workspace, then set up the database:

   ```bash
   npm run build --workspace common
   npm run db:migrate
   npm run db:seed
   ```

## Configuration

The application is configured through environment variables. Key variables
include:

- `APP_PORT`, `APP_URL`, `APP_NAME` — application host configuration
- `DATABASE_URL` — MySQL / MariaDB connection string
- `SHADOW_DATABASE_URL` — shadow database used by Prisma migrations
- `JWT_SECRET`, `CSRF_SECRET` — security secrets
- `QUEUE_DRIVER` — queue backend (`database` or `redis`)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USERNAME`, `SMTP_PASSWORD` —
  email server configuration
- `EMAIL_FROM`, `EMAIL_REPLY_TO`, `EMAIL_ADMIN` — email addresses

See `.env.dev` for the complete list of options.

## Development

```bash
npm run dev
```

This compiles the MJML email templates (in watch mode) and starts the server with
hot reloading. The dev server also generates the Prisma client as part of the
build step.

### Linting and Formatting

```bash
npm run lint        # Run ESLint
npm run lint:fix    # Fix lint issues
npm run format      # Format with Prettier
```

## Database

Prisma manages the schema and migrations. The schema lives in
`prisma/schema.prisma`.

```bash
npm run db:migrate   # Apply migrations (prisma migrate deploy)
npm run migrate      # Apply schema + data migrations
npm run db:seed      # Seed initial data
npm run db:reset     # DESTRUCTIVE — drops and recreates the schema
npm run db:studio    # Open Prisma Studio (database GUI)
```

> Primary keys are **ULID strings** (26 chars), never integers. Multilingual
> fields are stored as **JSON columns**. After changing `schema.prisma`, run
> `prisma migrate dev` — never edit the generated migration SQL by hand.

## Testing

```bash
npm run test         # Integration tests
npm run test:unit    # Unit tests
npm run test:int     # Integration tests
npm run test:unit:ui # Unit tests with the Vitest UI
npm run test:int:ui  # Integration tests with the Vitest UI
```

- **Unit tests** mock dependencies (`vitest-mock-extended`) and perform no real
  I/O.
- **Integration tests** require MariaDB. They run against a separate database
  (port 3307) and execute serially; migrations are applied automatically before
  the suite.

## Building for Production

```bash
npm run build       # Generate Prisma client, compile TypeScript, build email views
npm run production   # Run the production build
```

## Architecture

### Module System

Each feature is an `AppModule` with four responsibilities:

```ts
class ExampleModule implements AppModule {
  bindContainers(container: Container): void {} // DI bindings
  configure(app: Application): void {} // middleware
  registerRoutes(app: Application): void {} // mount router
  registerPermissions(): void {} // RBAC permissions
}
```

### Request Flow

```
Request → Router → Controller → Service (business logic) → Prisma → Response
```

- Services are decorated with `@injectable()` and injected via the constructor
  using `@inject(TYPES.ServiceName)`. All bindings are singletons; symbols live in
  `src/container/types.ts`.
- Routers extend `ModuleRouter` and use model binding for route params
  (`:campId` → `Camp` entity).
- Throw `ApiError` from services; centralized error middleware handles the
  response.
- Authorization uses RBAC permission guards — never write ad-hoc role checks.
  System roles: `USER`, `ADMIN`. Camp-scoped roles: `DIRECTOR`, `COORDINATOR`,
  `COUNSELOR`, `VIEWER`.

### Email

- MJML templates live in `src/views/emails/`.
- Use the `Mailable` pattern and register each mailable in the mailable registry.
- In development, outgoing email is captured by MailDev at http://localhost:1080.

### Path Alias

`#*` maps to `src/*` (see the `imports` field in `package.json`).

## License

Licensed under the [GNU Affero General Public License v3.0](../LICENSE)
(AGPL-3.0-only).
