# Camp Registration Backend

The Camp Registration Backend is a RESTful API service that powers the Camp Registration system. It provides endpoints for managing camps, registrations, users, and other related entities.

## Technologies

- **Node.js**: v22+ runtime environment
- **TypeScript**: For type-safe code
- **Express.js**: Web framework for building the API
- **Prisma ORM**: Database access and migrations
- **MySQL**: Database
- **Passport.js**: Authentication
- **Vitest**: Testing framework
- **Winston**: Logging
- **Nodemailer**: Email sending
- **MJML**: Email template rendering
- **Zod**: Schema validation

## Prerequisites

- Node.js v22+
- MySQL database
- npm or yarn

## Setup and Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/marvin-wtt/CampRegistration.git
   cd CampRegistration/backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.dev` to `.env`
   - Update the database connection string and other configuration values

4. Set up the database:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

## Configuration

The application uses environment variables for configuration. Key variables include:

- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: Secret for JWT tokens
- `JWT_ACCESS_EXPIRATION_MINUTES`: JWT access token expiration
- `JWT_REFRESH_EXPIRATION_DAYS`: JWT refresh token expiration
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`: Email server configuration
- `FRONTEND_URL`: URL of the frontend application

See `.env.dev` for a complete list of configuration options.

## Development

To start the development server:

```bash
npm run dev
```

This will:

1. Generate Prisma client
2. Compile email templates
3. Start the server with hot-reloading

### Code Style and Linting

The project uses ESLint and Prettier for code style and linting:

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Database Management

Prisma is used for database management:

```bash
# Apply migrations
npm run db:migrate

# Reset database (caution: deletes all data)
npm run db:reset

# Seed database with initial data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Testing

The project includes unit and integration tests:

```bash
# Run all tests
npm run test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:int

# Run tests with UI
npm run test:unit:ui
npm run test:int:ui
```

## Building for Production

To build the application for production:

```bash
npm run build
```

To run the production build:

```bash
npm run production
```

## Project Structure

- `src/app`: Application modules organized by domain
- `src/config`: Configuration files
- `src/core`: Core functionality and shared components
- `src/guards`: Authentication/authorization guards
- `src/i18n`: Internationalization support
- `src/jobs`: Background jobs or scheduled tasks
- `src/middlewares`: Express middleware
- `src/routes`: API route definitions
- `src/types`: TypeScript type definitions
- `src/utils`: Utility functions
- `src/views`: View templates (for emails)
- `prisma`: Database schema and migrations
- `tests`: Test files

## API Documentation

API documentation is available at `/api-docs` when running the server in development mode.

## License

This project is licensed under the MIT License.
