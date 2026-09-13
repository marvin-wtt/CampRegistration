# CLAUDE.md — frontend/

Frontend-specific conventions. The repo-wide overview, commands, and pitfalls live in the root `CLAUDE.md`.

## State & API

- One Pinia store per feature domain; use `storeToRefs()` for destructuring reactive state
- Services in `frontend/src/services/` wrap Axios; always type bodies using `common/` types

## Internationalization

- Locales: `en`, `de`, `fr`, `cs`, `pl`
- Frontend translations: `frontend/src/i18n/{locale}/`
- Backend translations: `backend/src/i18n/{locale}/`
- Every user-facing string must be added to **all** locale files

## MD3 Styling (Material Design 3 Expressive)

The frontend is themed with **`@anoyomoose/q2-fresh-paint-md3e`**, a Quasar app
extension that restyles the standard Quasar components to MD3 Expressive and adds
a few MD3-specific components. It is wired up in `frontend/quasar.config.ts`:

- The `md3e/boot` boot file and the `freshPaint({ themes: [md3eTheme(...)] })` Vite
  plugin generate the theme from a single `sourceColor` seed (`tonalSpot` scheme).
- A `prefer-color-scheme`-driven light/dark theme is generated automatically;
  Quasar's `dark: 'auto'` follows it. **Do not hardcode light/dark colors** — use
  tokens so both modes work.

**Design tokens — use `var(--md3-*)` for all colors.** Most existing custom CSS
already does this. The full token set lives in the package's `dist/theme/base.scss`;
common families:

- **Color roles**: `--md3-primary`, `--md3-on-primary`, `--md3-primary-container`,
  `--md3-on-primary-container` (and the same for `secondary`, `tertiary`, `error`,
  `warning`, `positive`, `info`).
- **Surfaces**: `--md3-surface`, `--md3-surface-container-lowest|low|/-high|-highest`,
  `--md3-surface-variant`, `--md3-background`, `--md3-on-surface`,
  `--md3-on-surface-variant`, `--md3-outline`, `--md3-outline-variant`.
- **RGB triplets** (for `rgba(...)`): e.g. `--md3-primary-rgb`, `--md3-surface-rgb`.
- Each color token also has explicit `--md3-<role>--light` / `--md3-<role>--dark`
  variants; the un-suffixed name is the auto-switching alias — prefer it.

**Utility classes** (no custom CSS needed for these):

- Shape: `.rounded-none|xs|sm|md|lg|lg-inc|xl|xl-inc|xxl|full`
- Elevation: `.elevation-0` … `.elevation-5`
- Opt-outs: `.no-morph` (disable button shape-morph on press), `.no-widening`
  (disable button-group widening). Shape tokens are also Sass vars
  (`$md3-corner-*`, `$md3-easing-*`) for use inside `<style lang="scss">`.

**MD3 components** — import from subpaths (these are _not_ auto-registered):

```ts
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { MToolbar } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar';
// also available: Md3eBtnGroup, Md3eFab, Md3eFabAction, Md3eSlider
```

- **`<m-btn>`** — drop-in QBtn replacement. Color shortcuts (`primary`,
  `secondary`, `tertiary`, `error`) and variants (`elevated`, `tonal`, `text`).
  Supports toggle/selection via `v-model` (boolean, single-select with `value`, or
  multi-select with an array). `elevated`/`tonal`/toggle buttons only support the
  four shortcut colors; use `allow-color` + `color="…"` to bypass for others.
- **`<m-toolbar>`** — QToolbar wrapper with `floating`, `vibrant`, `vertical`,
  `surface`, `no-gap` variants. All QBtn/QToolbar props and slots pass through.
- Every styling shortcut is also a plain CSS class (`.q-btn--toggle`,
  `.q-toolbar--floating`, …), so a vanilla QBtn/QToolbar can opt in without the
  wrapper.
- Icons use standard `material-icons` names (`icon="add"`, `icon="more_vert"`),
  **not** the `sym_r_*` names shown in the package's own JSDoc examples.

**SurveyJS theming**: `frontend/src/lib/surveyJs/theme/md3-adapter.scss` maps
the same MD3 tokens onto SurveyJS's `--sjs2-*` design tokens via the
`.sjs-theme-overrides` class, which SurveyJS stamps on every survey root and on
the Survey Creator root — importing the stylesheet re-skins both with live
`var(--md3-*)` references. `buildMd3LiteralTheme()` (in `literalTheme.ts`)
bakes those into computed `rgba()` literals for consumers that can't apply the
class or parse `var()`/`color-mix()`: PDF generation and the Survey Creator's
registered default theme.
