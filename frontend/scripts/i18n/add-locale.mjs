// Scaffold a new locale across the whole frontend.
//
// For the target locale it:
//   1. Adds a machine-translated `<i18n locale="xx">` block to every SFC that
//      has a source-locale block (skipping files that already have the locale).
//   2. Scaffolds src/i18n/<region>/ — translating the leaf store files and
//      copying the composition `index.ts` files verbatim (flagged for review).
//   3. Wires the locale into src/i18n/messages.ts.
//   4. Writes a review report listing every touched file and every string the
//      translator couldn't safely translate.
//
// The locale must already be present in config.mjs (LOCALES + REGION_DIRS).
//
// Usage:
//   node scripts/i18n/add-locale.mjs <locale> [--source en] [--stub] [--force]
//
//   --stub    copy source strings instead of calling the translation API
//   --force   overwrite an existing locale block / region directory
//
// Requires ANTHROPIC_API_KEY unless --stub is given.

import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, basename, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { stringify as stringifyYaml } from 'yaml';

import {
  findVueFiles,
  rel,
  walk,
  extractI18nBlocks,
  parseBlockBody,
  isLocaleBlock,
  flatten,
  setPath,
  isGlobalExcludedKey,
} from './lib.mjs';
import { translateStrings } from './translate.mjs';
import {
  LOCALES,
  SOURCE_LOCALE,
  REGION_DIRS,
  I18N_DIR,
  FRONTEND_ROOT,
} from './config.mjs';

function parseArgs(argv) {
  const args = {
    stub: false,
    force: false,
    source: SOURCE_LOCALE,
    locale: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--stub') args.stub = true;
    else if (a === '--force') args.force = true;
    else if (a === '--source') args.source = argv[++i];
    else if (!a.startsWith('--') && !args.locale) args.locale = a;
  }
  return args;
}

const reviewComment = (locale) =>
  `# AUTO-TRANSLATED — needs human review (see scripts/i18n/.add-locale-report.${locale}.json)`;

/**
 * Translate the string leaves of `sourceObj`, returning a fresh nested object
 * with the same key order. Protected keys keep their source value.
 */
async function translateObject(sourceObj, source, target, { stub, exclude = () => false }) {
  const flat = [...flatten(sourceObj)]; // [path, value] in source order
  const toTranslate = [];
  const indexOfPath = new Map();
  for (const [path, value] of flat) {
    if (typeof value === 'string' && !exclude(path)) {
      indexOfPath.set(path, toTranslate.length);
      toTranslate.push(value);
    }
  }

  const { translations, warnings } = await translateStrings(
    toTranslate,
    source,
    target,
    { stub },
  );

  const result = {};
  for (const [path, value] of flat) {
    if (indexOfPath.has(path)) {
      setPath(result, path, translations[indexOfPath.get(path)]);
    } else {
      setPath(result, path, value); // protected or non-string
    }
  }

  // Re-map warning indices back to their key paths for the report.
  const pathByIndex = new Map([...indexOfPath].map(([p, i]) => [i, p]));
  const keyedWarnings = warnings.map((w) => ({
    key: pathByIndex.get(w.index),
    reason: w.reason,
  }));

  return { result, warnings: keyedWarnings };
}

async function processSfcFiles(opts, report, touched) {
  const files = await findVueFiles();

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const blocks = extractI18nBlocks(source);
    const localeBlocks = blocks.filter((b) => isLocaleBlock(b, LOCALES));

    const sourceBlock = localeBlocks.find((b) => b.locale === opts.source);
    if (!sourceBlock) continue;

    const existing = localeBlocks.find((b) => b.locale === opts.locale);
    if (existing && !opts.force) {
      report.skipped.push({ file: rel(file), reason: 'locale block exists' });
      continue;
    }

    let sourceObj;
    try {
      sourceObj = parseBlockBody(sourceBlock);
    } catch (err) {
      report.warnings.push({
        file: rel(file),
        reason: `parse error: ${err.message}`,
      });
      continue;
    }

    const { result, warnings } = await translateObject(
      sourceObj,
      opts.source,
      opts.locale,
      opts,
    );
    if (warnings.length) {
      report.warnings.push(...warnings.map((w) => ({ file: rel(file), ...w })));
    }

    const yaml = stringifyYaml(result, {
      defaultStringType: 'QUOTE_SINGLE',
      defaultKeyType: 'PLAIN',
      lineWidth: 0,
    });
    const newBlock = `<i18n lang="yaml" locale="${opts.locale}">\n${reviewComment(
      opts.locale,
    )}\n${yaml}</i18n>`;

    let updated;
    if (existing) {
      // Replace in place (force mode).
      updated =
        source.slice(0, existing.start) + newBlock + source.slice(existing.end);
    } else {
      // Insert after the last existing locale block.
      const insertAt = Math.max(...localeBlocks.map((b) => b.end));
      updated =
        source.slice(0, insertAt) + '\n\n' + newBlock + source.slice(insertAt);
    }

    await writeFile(file, updated);
    report.sfcFiles.push(rel(file));
    touched.add(file);
  }
}

async function processGlobalTree(opts, report, touched) {
  const sourceDir = resolve(I18N_DIR, REGION_DIRS[opts.source]);
  const targetDir = resolve(I18N_DIR, REGION_DIRS[opts.locale]);

  if (existsSync(targetDir) && !opts.force) {
    report.skipped.push({
      file: `src/i18n/${REGION_DIRS[opts.locale]}/`,
      reason: 'region directory exists',
    });
    return;
  }

  const tsFiles = await walk(sourceDir, '.ts');
  for (const srcPath of tsFiles) {
    const targetPath = resolve(targetDir, relative(sourceDir, srcPath));
    await mkdir(dirname(targetPath), { recursive: true });

    if (basename(srcPath) === 'index.ts') {
      // Composition file (imports + nested refs, possibly inline strings).
      // Copy verbatim and flag any inline strings for manual review.
      await cp(srcPath, targetPath);
      report.globalIndexFiles.push(rel(targetPath));
    } else {
      // Pure leaf object literal — translate its values.
      const sourceObj = await import('./lib.mjs').then((m) =>
        m.jiti.import(srcPath).then((mod) => mod?.default ?? mod),
      );
      const { result, warnings } = await translateObject(
        sourceObj,
        opts.source,
        opts.locale,
        { ...opts, exclude: isGlobalExcludedKey },
      );
      if (warnings.length) {
        report.warnings.push(
          ...warnings.map((w) => ({ file: rel(targetPath), ...w })),
        );
      }
      const banner =
        `// ${reviewComment(opts.locale).slice(2)}\n` +
        `export default ${JSON.stringify(result, null, 2)};\n`;
      await writeFile(targetPath, banner);
      report.globalLeafFiles.push(rel(targetPath));
      touched.add(targetPath);
    }
  }
}

async function updateMessagesIndex(opts, report) {
  const messagesPath = resolve(I18N_DIR, 'messages.ts');
  let text = await readFile(messagesPath, 'utf8');
  const region = REGION_DIRS[opts.locale];
  const ident = region.replace(/-/g, '');

  if (text.includes(`'${region}':`)) {
    report.skipped.push({
      file: 'src/i18n/messages.ts',
      reason: 'locale already mapped',
    });
    return;
  }

  // Add the import after the last existing locale import.
  text = text.replace(
    /(import \w+ from '\.\/[\w-]+';\n)(?![\s\S]*import \w+ from '\.\/[\w-]+';)/,
    `$1import ${ident} from './${region}';\n`,
  );

  // Add the mapping entries before the closing `}`.
  text = text.replace(
    /(\n)(\} as const;)/,
    `\n  '${region}': ${ident},\n  ${opts.locale}: ${ident},$1$2`,
  );

  await writeFile(messagesPath, text);
  report.messagesUpdated = true;
}

function runPrettier(globs) {
  if (globs.length === 0) return;
  try {
    execFileSync('npx', ['prettier', '--write', ...globs], {
      cwd: FRONTEND_ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
  } catch (err) {
    console.warn(
      `\nprettier formatting failed (run it manually): ${err.message}`,
    );
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.locale) {
    console.error(
      'Usage: node scripts/i18n/add-locale.mjs <locale> [--source en] [--stub] [--force]',
    );
    process.exit(1);
  }
  if (!LOCALES.includes(opts.locale) || !REGION_DIRS[opts.locale]) {
    console.error(
      `Locale "${opts.locale}" is not configured. Add it to LOCALES and REGION_DIRS ` +
        `in scripts/i18n/config.mjs first.`,
    );
    process.exit(1);
  }
  if (opts.locale === opts.source) {
    console.error('Target locale must differ from --source.');
    process.exit(1);
  }

  console.log(
    `Scaffolding locale "${opts.locale}" from "${opts.source}"` +
      (opts.stub ? ' (stub mode — no API calls)' : ' (machine-translated)') +
      '...\n',
  );

  const report = {
    locale: opts.locale,
    source: opts.source,
    stub: opts.stub,
    generatedAt: new Date().toISOString(),
    sfcFiles: [],
    globalLeafFiles: [],
    globalIndexFiles: [],
    messagesUpdated: false,
    skipped: [],
    warnings: [],
  };
  const touched = new Set();

  await processSfcFiles(opts, report, touched);
  await processGlobalTree(opts, report, touched);
  await updateMessagesIndex(opts, report);

  const reportPath = resolve(
    dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')),
    `.add-locale-report.${opts.locale}.json`,
  );
  await writeFile(reportPath, JSON.stringify(report, null, 2));

  // Format the generated global files (their JSON serialization needs it).
  runPrettier([`src/i18n/${REGION_DIRS[opts.locale]}/**/*.ts`]);

  console.log(`\nDone.`);
  console.log(`  SFC blocks added:        ${report.sfcFiles.length}`);
  console.log(`  Global leaf files:       ${report.globalLeafFiles.length}`);
  console.log(
    `  Global index files:      ${report.globalIndexFiles.length} (copied verbatim — review inline strings)`,
  );
  console.log(`  messages.ts updated:     ${report.messagesUpdated}`);
  console.log(`  Skipped:                 ${report.skipped.length}`);
  console.log(`  Placeholder warnings:    ${report.warnings.length}`);
  console.log(`\nReview report: ${rel(reportPath)}`);
  console.log(
    `Next: run "npm run i18n:check" and have a ${opts.locale} speaker review the marked blocks.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
