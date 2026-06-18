// i18n completeness validator.
//
// Walks every SFC `<i18n>` block and every global src/i18n/<region>/ tree and
// checks each locale against the source locale for:
//   - missing locale blocks / files
//   - missing or orphaned keys
//   - mismatched ICU `{placeholder}` tokens (which would break interpolation)
//
// Exits non-zero on any problem so it can gate `npm run lint` / CI.
//
// Usage:
//   node scripts/i18n/check.mjs            # check all locales
//   node scripts/i18n/check.mjs --locale fr

import {
  findVueFiles,
  rel,
  extractI18nBlocks,
  parseBlockBody,
  isLocaleBlock,
  flatten,
  placeholders,
  loadGlobalMessages,
  isGlobalExcludedKey,
} from './lib.mjs';
import { LOCALES, SOURCE_LOCALE, REGION_DIRS } from './config.mjs';

function parseArgs(argv) {
  const args = { locales: LOCALES };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--locale' && argv[i + 1]) {
      args.locales = [SOURCE_LOCALE, argv[++i]];
    }
  }
  return args;
}

// One problem record: { file, locale, kind, detail }
// `exclude(key)` skips a key entirely (used to exempt global-only keys).
function compareLocale(problems, file, locale, sourceMap, localeMap, exclude = () => false) {
  for (const [key, srcVal] of sourceMap) {
    if (exclude(key)) continue;
    if (!localeMap.has(key)) {
      problems.push({ file, locale, kind: 'missing-key', detail: key });
      continue;
    }
    const srcPh = placeholders(srcVal);
    const locPh = placeholders(localeMap.get(key));
    const missing = [...srcPh].filter((p) => !locPh.has(p));
    const extra = [...locPh].filter((p) => !srcPh.has(p));
    if (missing.length || extra.length) {
      const parts = [];
      if (missing.length) parts.push(`missing ${missing.join(', ')}`);
      if (extra.length) parts.push(`unexpected ${extra.join(', ')}`);
      problems.push({
        file,
        locale,
        kind: 'placeholder',
        detail: `${key} (${parts.join('; ')})`,
      });
    }
  }
  for (const key of localeMap.keys()) {
    if (exclude(key)) continue;
    if (!sourceMap.has(key)) {
      problems.push({ file, locale, kind: 'orphan-key', detail: key });
    }
  }
}

async function checkSfcBlocks(locales) {
  const problems = [];
  const files = await findVueFiles();

  for (const file of files) {
    const source = await import('node:fs/promises').then((fs) =>
      fs.readFile(file, 'utf8'),
    );
    const blocks = extractI18nBlocks(source).filter((b) =>
      isLocaleBlock(b, LOCALES),
    );
    if (blocks.length === 0) continue;

    // Merge multiple blocks of the same locale (rare but possible).
    const byLocale = new Map();
    for (const block of blocks) {
      let parsed;
      try {
        parsed = parseBlockBody(block);
      } catch (err) {
        problems.push({
          file: rel(file),
          locale: block.locale,
          kind: 'parse-error',
          detail: err.message,
        });
        continue;
      }
      const map = flatten(parsed);
      const existing = byLocale.get(block.locale);
      if (existing) for (const [k, v] of map) existing.set(k, v);
      else byLocale.set(block.locale, map);
    }

    const sourceMap = byLocale.get(SOURCE_LOCALE);
    if (!sourceMap) {
      problems.push({
        file: rel(file),
        locale: SOURCE_LOCALE,
        kind: 'missing-locale',
        detail: 'no source-locale block',
      });
      continue;
    }

    for (const locale of locales) {
      if (locale === SOURCE_LOCALE) continue;
      const localeMap = byLocale.get(locale);
      if (!localeMap) {
        problems.push({
          file: rel(file),
          locale,
          kind: 'missing-locale',
          detail: 'no block for this locale',
        });
        continue;
      }
      compareLocale(problems, rel(file), locale, sourceMap, localeMap);
    }
  }
  return problems;
}

async function checkGlobalTrees(locales) {
  const problems = [];
  const sourceMap = flatten(await loadGlobalMessages(SOURCE_LOCALE));

  for (const locale of locales) {
    if (locale === SOURCE_LOCALE) continue;
    const label = `src/i18n/${REGION_DIRS[locale]}/`;
    let localeMap;
    try {
      localeMap = flatten(await loadGlobalMessages(locale));
    } catch (err) {
      problems.push({
        file: label,
        locale,
        kind: 'missing-locale',
        detail: `cannot load global messages: ${err.message}`,
      });
      continue;
    }
    compareLocale(problems, label, locale, sourceMap, localeMap, isGlobalExcludedKey);
  }
  return problems;
}

function report(problems) {
  if (problems.length === 0) {
    console.log('i18n check: all locales complete and consistent.');
    return 0;
  }

  // Group by file for readable output.
  const byFile = new Map();
  for (const p of problems) {
    if (!byFile.has(p.file)) byFile.set(p.file, []);
    byFile.get(p.file).push(p);
  }

  for (const [file, items] of byFile) {
    console.error(`\n${file}`);
    for (const p of items) {
      console.error(`  [${p.locale}] ${p.kind}: ${p.detail}`);
    }
  }

  const counts = problems.reduce((acc, p) => {
    acc[p.kind] = (acc[p.kind] || 0) + 1;
    return acc;
  }, {});
  const summary = Object.entries(counts)
    .map(([k, n]) => `${n} ${k}`)
    .join(', ');
  console.error(
    `\ni18n check failed: ${problems.length} problem(s) (${summary}).`,
  );
  return 1;
}

async function main() {
  const { locales } = parseArgs(process.argv.slice(2));
  const [sfc, global] = await Promise.all([
    checkSfcBlocks(locales),
    checkGlobalTrees(locales),
  ]);
  process.exit(report([...sfc, ...global]));
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
