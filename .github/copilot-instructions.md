# Camp Registration Development Instructions

**ALWAYS follow these instructions first and fallback to additional search and context gathering only if the information here is incomplete or found to be in error.**

Camp Registration is a full-stack web application for managing youth camp registrations. It consists of a Vue 3/Quasar frontend, Node.js/Express backend with Prisma ORM, and shared TypeScript common library, organized as an npm workspace monorepo.

## Working Effectively

### Initial Setup
**CRITICAL**: This application requires Node.js v22.16.0 or higher. Install Node.js v22.16.0+:
```bash
curl -fsSL https://nodejs.org/dist/v22.16.0/node-v22.16.0-linux-x64.tar.xz -o node.tar.xz
tar -xf node.tar.xz
sudo mv node-v22.16.0-linux-x64 /usr/local/node22
sudo ln -sf /usr/local/node22/bin/node /usr/local/bin/node
sudo ln -sf /usr/local/node22/bin/npm /usr/local/bin/npm
```

Install dependencies:
```bash
# KNOWN ISSUE: Cypress binary download fails in restricted networks
CYPRESS_INSTALL_BINARY=0 npm install
```

### Build Process
**CRITICAL BUILD TIMING**: Set timeouts to 90+ minutes for builds. NEVER CANCEL builds.

Build all workspaces:
```bash
npm run build
# Takes ~25 seconds total when successful
# Frontend builds in ~23 seconds
# Common builds as dependency (~2 seconds)
# Backend fails without database/Prisma setup
```

Build individual workspaces:
```bash
npm run build --workspace common          # ~2 seconds
npm run build --workspace frontend        # ~23 seconds  
npm run build --workspace backend         # Requires database setup
```

**BACKEND BUILD LIMITATION**: Backend builds fail without Prisma client generation, which requires:
1. Database connection (MariaDB)
2. Prisma binary downloads (may fail in restricted networks)

### Database Setup
Backend requires MariaDB database. Use Docker for development:
```bash
cd backend
docker-compose up -d
# Starts MariaDB on port 3307
# Default connection: mysql://user:password@localhost:3307/database
```

Set up environment:
```bash
cp backend/.env.dev backend/.env
# Update DATABASE_URL if needed
```

Run database migrations:
```bash
npm run db:migrate --workspace backend
npm run db:seed --workspace backend
```

### Testing
**CRITICAL TEST TIMING**: Set timeouts to 30+ minutes for test suites. NEVER CANCEL running tests.

Test all workspaces:
```bash
npm run test --workspaces
# Common: ~2 seconds (55 tests)
# Frontend: ~5 seconds (22 tests, 7 skipped)  
# Backend: Requires database setup
```

Test individual workspaces:
```bash
npm run test --workspace common           # ~2 seconds
npm run test --workspace frontend         # ~5 seconds
npm run test --workspace backend          # Requires database
```

Backend testing options:
```bash
cd backend
npm run test:unit                         # Unit tests only
npm run test:int                          # Integration tests (requires database)
npm run test:unit:ui                      # Unit tests with Vitest UI
npm run test:int:ui                       # Integration tests with UI
```

### Development Servers

Start frontend development server:
```bash
npm run dev --workspace frontend
# Runs on http://localhost:9000
# Shows "Internal Server Error" without backend
```

Start backend development server:
```bash
# Requires database setup first
npm run dev --workspace backend
# Runs on http://localhost:3000
# Includes email development server on port 8081
```

### Code Quality
**LINTING LIMITATION**: Backend linting fails without Prisma client generation.

Run linting:
```bash
npm run lint --workspaces --if-present
# Common: Works (~1 second)
# Frontend: Works (~3 seconds)
# Backend: Fails without Prisma types
```

Run formatting:
```bash
npm run format --workspaces --if-present          # Fix formatting
npm run format:check --workspaces --if-present    # Check formatting
```

**ALWAYS run before committing**:
```bash
npm run format --workspaces --if-present
npm run lint --workspace common
npm run lint --workspace frontend
# Skip backend lint if Prisma setup incomplete
```

## Network-Restricted Environment Workarounds

**KNOWN NETWORK ISSUES**:
- Cypress binary downloads fail: Use `CYPRESS_INSTALL_BINARY=0`
- Prisma binary downloads fail: Cannot build/lint backend
- E2E tests cannot run without Cypress

**Frontend-Only Development**:
When backend setup is not possible, you can work on the frontend:
```bash
CYPRESS_INSTALL_BINARY=0 npm install
npm run build --workspace common
npm run build --workspace frontend
npm run test --workspace common
npm run test --workspace frontend
npm run dev --workspace frontend
```

## Validation Scenarios

**ALWAYS test these scenarios after making changes**:

### Frontend Validation
1. Build frontend: `npm run build --workspace frontend`
2. Run frontend tests: `npm run test --workspace frontend`
3. Start dev server: `npm run dev --workspace frontend`
4. Navigate to http://localhost:9000
5. Verify application loads (may show backend error if backend not running)

### Backend Validation (when database available)
1. Start database: `cd backend && docker-compose up -d`
2. Setup environment: `cp backend/.env.dev backend/.env`
3. Run migrations: `npm run db:migrate --workspace backend`
4. Build backend: `npm run build --workspace backend`
5. Run tests: `npm run test --workspace backend`
6. Start dev server: `npm run dev --workspace backend`
7. Verify API responds on http://localhost:3000

### Full Stack Validation
1. Complete backend validation steps
2. In separate terminal: `npm run dev --workspace frontend`
3. Navigate to http://localhost:9000
4. Verify no "Internal Server Error" - application should load completely
5. Test user registration/login flow if possible

## Common Tasks Reference

### Repository Structure
```
/
├── README.md
├── package.json              # Root workspace config
├── .nvmrc                    # Node.js v22.16.0
├── common/                   # Shared TypeScript library
│   ├── package.json
│   └── src/
├── backend/                  # Node.js/Express API
│   ├── package.json
│   ├── prisma/
│   ├── docker-compose.yml    # MariaDB setup
│   └── src/
├── frontend/                 # Vue 3/Quasar web app
│   ├── package.json
│   ├── quasar.config.ts
│   └── src/
├── e2e/                      # Cypress E2E tests
│   ├── package.json
│   └── cypress/
└── .github/workflows/        # CI/CD pipelines
```

### Key Files to Monitor
- `package.json` files: Workspace dependencies and scripts
- `backend/prisma/schema.prisma`: Database schema
- `backend/.env.dev`: Environment configuration template
- `.github/workflows/`: CI/CD pipeline definitions
- `frontend/quasar.config.ts`: Frontend build configuration

### Technology Stack
- **Frontend**: Vue 3, Quasar Framework, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: MariaDB (MySQL compatible)
- **Testing**: Vitest (unit/integration), Cypress (E2E)
- **Tooling**: ESLint, Prettier, npm workspaces

### CI/CD Pipeline Requirements
The GitHub Actions workflows require:
- All linting to pass: `npm run lint --workspaces --if-present`
- All formatting to pass: `npm run format:check --workspaces --if-present`
- All tests to pass: `npm run test --workspaces`
- Successful builds: `npm run build`

**NEVER CANCEL**: CI builds can take 15+ minutes. Database setup adds 5+ minutes. E2E tests add 10+ minutes.

## Troubleshooting

### "Cannot find module '@prisma/client'"
The Prisma client hasn't been generated. Requires database setup:
1. Start database: `cd backend && docker-compose up -d`
2. Generate client: `cd backend && npx prisma generate`

### "Cypress binary not found"
Install without Cypress in restricted networks:
```bash
CYPRESS_INSTALL_BINARY=0 npm install
```

### "ENOTFOUND binaries.prisma.sh"
Prisma binaries cannot download. Backend build/lint will fail. Use frontend-only development workflow.

### Frontend shows "Internal Server Error"
Expected when backend is not running. Start backend with database setup or work on frontend components that don't require API calls.

### Build takes longer than expected
**NORMAL**: Builds can take 20+ minutes in CI environments. Frontend builds are fastest (~23s), backend requires database setup time.