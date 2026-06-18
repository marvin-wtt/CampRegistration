// Machine translation for the locale scaffolder, via the Anthropic API.
//
// Translates an array of source strings into a target language while preserving
// ICU `{placeholder}` tokens and vue-i18n `|` plural separators. Uses structured
// outputs so the response is guaranteed-parseable JSON.
//
// Requires ANTHROPIC_API_KEY in the environment. Pass `--stub` to add-locale to
// skip the API entirely (copies source strings) — useful for dry runs and CI.

import { placeholders } from './lib.mjs';
import { LOCALE_NAMES } from './config.mjs';

const MODEL = process.env.I18N_TRANSLATE_MODEL || 'claude-opus-4-8';
const BATCH_SIZE = 40;

function systemPrompt(sourceName, targetName) {
  return [
    `You are a professional software localizer translating UI strings for a`,
    `youth camp registration web app from ${sourceName} to ${targetName}.`,
    ``,
    `Rules:`,
    `- Translate the meaning naturally and concisely, as a native ${targetName}`,
    `  speaker would expect in a software UI.`,
    `- Preserve every ICU placeholder token EXACTLY as written, including braces`,
    `  and the name inside, e.g. {name}, {count}, {field}. Never translate,`,
    `  rename, reorder the characters of, add, or remove a placeholder.`,
    `- Preserve vue-i18n pluralization: keep the same number of "|"-separated`,
    `  segments and translate each segment.`,
    `- Do not translate brand names or code identifiers.`,
    `- Return exactly one translation per input string, in the same order.`,
    `- Respond with ONLY a JSON array of strings — no prose, no markdown, no`,
    `  code fences.`,
  ].join('\n');
}

/** Pull the first top-level JSON array out of the model's text response. */
function extractJsonArray(text) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  const start = trimmed.indexOf('[');
  const end = trimmed.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`no JSON array found in translation response`);
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

async function callAnthropic(client, texts, sourceLocale, targetLocale) {
  const sourceName = LOCALE_NAMES[sourceLocale] ?? sourceLocale;
  const targetName = LOCALE_NAMES[targetLocale] ?? targetLocale;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: systemPrompt(sourceName, targetName),
    messages: [
      {
        role: 'user',
        content:
          `Translate these ${texts.length} strings to ${targetName}. ` +
          `Return a JSON array of ${texts.length} strings in the same order.\n\n` +
          JSON.stringify(texts, null, 2),
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
  const out = extractJsonArray(text);
  if (!Array.isArray(out) || out.length !== texts.length) {
    throw new Error(
      `translation count mismatch: expected ${texts.length}, got ${
        Array.isArray(out) ? out.length : 'non-array'
      }`,
    );
  }
  return out;
}

/**
 * Translate `texts` (array of source strings) to `targetLocale`.
 * Returns `{ translations: string[], warnings: [{ index, reason }] }`.
 * On a placeholder mismatch for an item, the source string is kept and a
 * warning is recorded rather than shipping a broken interpolation.
 */
export async function translateStrings(texts, sourceLocale, targetLocale, { stub } = {}) {
  if (texts.length === 0) return { translations: [], warnings: [] };

  if (stub) {
    return { translations: [...texts], warnings: [] };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Set it, or run with --stub to copy source strings.',
    );
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const translations = new Array(texts.length);
  const warnings = [];

  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);
    const result = await callAnthropic(client, batch, sourceLocale, targetLocale);
    for (let i = 0; i < batch.length; i++) {
      const idx = start + i;
      const srcPh = placeholders(batch[i]);
      const outPh = placeholders(result[i]);
      const intact =
        srcPh.size === outPh.size && [...srcPh].every((p) => outPh.has(p));
      if (intact) {
        translations[idx] = result[i];
      } else {
        translations[idx] = batch[i]; // keep source rather than break interpolation
        warnings.push({
          index: idx,
          reason: `placeholder mismatch; kept source string`,
        });
      }
    }
  }

  return { translations, warnings };
}
