// Shared helpers for the i18n tooling: file discovery, `<i18n>` block parsing,
// key flattening, and ICU-placeholder extraction.

import { readdir } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { createJiti } from 'jiti';

import {
  SRC_DIR,
  I18N_DIR,
  FRONTEND_ROOT,
  REGION_DIRS,
  NON_LOCALE_BLOCKS,
  GLOBAL_EXCLUDED_KEYS,
} from './config.mjs';

const jiti = createJiti(import.meta.url);

/** Recursively collect files under `dir` matching `ext` (e.g. '.vue'). */
export async function walk(dir, ext, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }
      await walk(full, ext, out);
    } else if (extname(entry.name) === ext) {
      out.push(full);
    }
  }
  return out;
}

/** All `.vue` files under src/, as absolute paths. */
export function findVueFiles() {
  return walk(SRC_DIR, '.vue');
}

/** Path relative to the frontend root, with forward slashes (for display). */
export function rel(absPath) {
  return relative(FRONTEND_ROOT, absPath).split('\\').join('/');
}

// `(?=[\s/>])` ensures we match the `<i18n>` SFC custom block, NOT the
// `<i18n-t>` / `<i18n-d>` vue-i18n components (where `\b` would match before `-`).
const I18N_BLOCK_RE = /<i18n(?=[\s/>])([^>]*)>([\s\S]*?)<\/i18n>/g;

function parseAttrs(attrString) {
  const attrs = {};
  const re = /(\w+)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(attrString)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

/**
 * Extract `<i18n>` blocks from SFC source.
 * Returns `{ locale, lang, body, raw, start, end, attrString }` for each block,
 * where `start`/`end` are character offsets into `source`.
 */
export function extractI18nBlocks(source) {
  const blocks = [];
  let m;
  I18N_BLOCK_RE.lastIndex = 0;
  while ((m = I18N_BLOCK_RE.exec(source)) !== null) {
    const attrs = parseAttrs(m[1]);
    blocks.push({
      locale: attrs.locale,
      lang: attrs.lang || 'json',
      attrString: m[1],
      body: m[2],
      raw: m[0],
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return blocks;
}

/** Parse a block body to an object, respecting its `lang`. */
export function parseBlockBody(block) {
  const text = block.body.trim();
  if (text === '') {
    return {};
  }
  if (block.lang === 'yaml' || block.lang === 'yml') {
    return parseYaml(text) ?? {};
  }
  return JSON.parse(text);
}

/** Is this `<i18n>` block a real translation locale (vs. an enum-style block)? */
export function isLocaleBlock(block, locales) {
  if (!block.locale) {
    return false;
  }
  if (NON_LOCALE_BLOCKS.has(block.locale)) {
    return false;
  }
  return locales.includes(block.locale);
}

/**
 * Flatten a nested messages object to a Map of dotted-path -> string value.
 * Arrays are flattened by numeric index. Non-string leaves are coerced via
 * String() so the validator still sees them as present keys.
 */
export function flatten(obj, prefix = '', out = new Map()) {
  if (obj == null) {
    return out;
  }
  if (typeof obj !== 'object') {
    out.set(prefix, obj);
    return out;
  }
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === 'object') {
      flatten(value, path, out);
    } else {
      out.set(path, value);
    }
  }
  return out;
}

const blockedKeys = new Set(['__proto__', 'constructor', 'prototype']);

/** Set a dotted path on a nested object, creating intermediate objects. */
export function setPath(obj, path, value) {
  const parts = path.split('.');
  let node = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (blockedKeys.has(k)) {
      return;
    }
    if (node[k] == null || typeof node[k] !== 'object') {
      node[k] = {};
    }
    node = node[k];
  }

  const last = parts[parts.length - 1];
  if (blockedKeys.has(last)) {
    return;
  }
  node[last] = value;
}

/** The set of ICU-style `{placeholder}` tokens in a string. */
export function placeholders(value) {
  const set = new Set();
  if (typeof value !== 'string') {
    return set;
  }
  const re = /\{[^{}]+}/g;
  let m;
  while ((m = re.exec(value)) !== null) {
    set.add(m[0]);
  }
  return set;
}

/**
 * True if `path` is exempt in the GLOBAL src/i18n trees (matches any
 * GLOBAL_EXCLUDED_KEYS pattern; supports a trailing `.*`). Apply this only when
 * checking/scaffolding global trees — never for SFC `<i18n>` blocks.
 */
export function isGlobalExcludedKey(path) {
  return GLOBAL_EXCLUDED_KEYS.some((pattern) => {
    if (pattern.endsWith('.*')) {
      const base = pattern.slice(0, -2);
      return path === base || path.startsWith(base + '.');
    }
    // bare leaf name match anywhere in the path, or exact full-path match
    return path === pattern || path.endsWith('.' + pattern);
  });
}

/** Absolute path to a global locale's index.ts (e.g. src/i18n/de-DE/index.ts). */
export function globalIndexPath(locale) {
  return resolve(I18N_DIR, REGION_DIRS[locale], 'index.ts');
}

/** Load a global locale's fully-resolved messages object via jiti. */
export async function loadGlobalMessages(locale) {
  const mod = await jiti.import(globalIndexPath(locale));
  return mod?.default ?? mod;
}

export { jiti };
