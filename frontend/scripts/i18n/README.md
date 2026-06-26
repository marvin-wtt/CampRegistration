# i18n tooling

Tooling to keep the per-locale `<i18n>` blocks (and the global `src/i18n/<region>/`
trees) complete and consistent, and to scaffold a new locale in one command.

Translations stay **co-located** in each SFC as separate `<i18n locale="..">`
blocks — these scripts make that layout scale instead of changing it.

## Configuration

Everything is driven by [`config.mjs`](./config.mjs). To add a locale, edit two
constants there (`LOCALES`, `REGION_DIRS`), then run the scaffolder.

## Validate completeness — `npm run i18n:check`

Walks every SFC `<i18n>` block and every global locale tree and checks each
locale against the source locale (`en`) for:

- missing locale blocks / files
- missing or orphaned keys
- mismatched ICU `{placeholder}` tokens (which silently break interpolation)

Exits non-zero on any problem. Check a single locale with
`node scripts/i18n/check.mjs --locale fr`.

### Enabling it as a build gate

Once the existing drift it reports is fixed, gate `lint`/CI on it by appending
to the `lint` script in `package.json`:

```jsonc
"lint": "eslint -c ./eslint.config.js \"./src*/**/*.{ts,js,cjs,mjs,vue}\" && npm run i18n:check",
```

CI already runs `lint`, so no separate workflow change is needed.

## Scaffold a new locale — `npm run i18n:add-locale -- <locale>`

1. Add the locale to `LOCALES` and `REGION_DIRS` in `config.mjs`.
2. Run `npm run i18n:add-locale -- <locale>` (requires `ANTHROPIC_API_KEY`).

It machine-translates the `en` strings into a new `<i18n locale="<locale>">`
block in every SFC, scaffolds `src/i18n/<region>/`, wires the locale into
`messages.ts`, and writes a review report listing every touched file.

Flags:

- `--stub` — copy `en` strings instead of calling the API (offline dry run / CI).
- `--source <code>` — translate from a locale other than `en`.
- `--force` — overwrite an existing locale block / region directory.

Every generated block is marked `# AUTO-TRANSLATED — needs human review`. After
running, execute `npm run i18n:check` and have a native speaker review the marked
blocks. Translation uses the Claude API (`claude-opus-4-8` by default; override
with `I18N_TRANSLATE_MODEL`) and verifies that every ICU placeholder survives —
if one doesn't, the source string is kept and the report flags it.

### Limitations

The global `index.ts` composition files (`src/i18n/<region>/index.ts` and
`.../stores/index.ts`) are copied verbatim, not translated. Their few inline
strings (e.g. `service.*`, `country.*`) need manual translation — they're listed
under `globalIndexFiles` in the review report.
