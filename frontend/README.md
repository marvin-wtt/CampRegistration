# Camp Registration Frontend

`@camp-registration/web` — a Vue 3 / Quasar single-page application that lets users
register for a youth camp and lets counselors manage the camp.

## Technologies

- **Vue 3** + **TypeScript**
- **Quasar** (Vite app extension) — UI framework
- **Pinia** — state management
- **vue-i18n** — internationalization
- **vue-router** — routing
- **SurveyJS** — dynamic registration forms and form editor
- **Axios** — HTTP client
- **Tiptap** — rich text editing
- **ApexCharts** — charts and statistics
- **Vitest** — testing

## Prerequisites

- Node.js `>=22 <25`
- A running [backend](../backend) instance for the API

## Setup

Install dependencies (preferably from the repository root so the workspace is
linked) and create an env file:

```bash
npm install
cp .env.example .env
```

The [`common`](../common) workspace must be built before running the frontend:

```bash
npm run build --workspace common
```

## Configuration

Environment variables are defined in `.env`:

- `SURVEYJS_LICENSE_KEY` — SurveyJS developer license key (used by the form editor)

## Development

```bash
npm run dev          # Start the Quasar dev server
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run build        # Build for production
```

### Testing

```bash
npm run test         # Run unit tests once (CI mode)
npm run test:unit    # Run unit tests in watch mode
npm run test:unit:ui # Run unit tests with the Vitest UI
```

## Features

### Custom registration form

The registration form is fully customizable based on the information needed for
each camp. It is built and edited with [SurveyJS](https://surveyjs.io/).

### Dashboard

An overview of the camp with key statistics and quick access to management tools.

### Participants view

Browse, filter, and manage registered participants, including configurable table
cells driven by the camp's form fields.

### Program planner

A calendar that lets managers schedule all activities for the camp.

### Emails

Compose and send templated emails to participants and counselors.

### Tools

Utilities to help fill forms for the FGYO or other organisations.

## Dynamic Form Editor

The registration form can be tailored to each camp with the SurveyJS form editor.
Instructions for the editor are available in the
[SurveyJS end-user guide](https://surveyjs.io/survey-creator/documentation/end-user-guide).

In addition to the default question types, several custom questions are tailored
for camp registration (address, country, date of birth, role). See the
[common package](../common#custom-questions) for details.

## MD3 Styling

The app is themed with **Material Design 3 Expressive** via the
[`@anoyomoose/q2-fresh-paint-md3e`](https://www.npmjs.com/package/@anoyomoose/q2-fresh-paint-md3e)
Quasar app extension. Style with `var(--md3-*)` design tokens (never hardcoded
colors), use the `.rounded-*` / `.elevation-*` utility classes, and prefer the
`<m-btn>` / `<m-toolbar>` MD3 components. See the
[project guidelines](../CLAUDE.md#md3-styling-material-design-3-expressive) for the
full token set and component usage.

## Internationalization

Supported locales: `en`, `de`, `fr`, `cs`, `pl`. Translations live in
`src/i18n/{locale}/`. Every user-facing string must be added to **all** locale
files.

## License

Licensed under the [GNU Affero General Public License v3.0](../LICENSE)
(AGPL-3.0-only).
