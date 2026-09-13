import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { metaRoute, type PageMetaResolver } from '#core/meta/metaRoute';
import type { PageMeta } from '#utils/pageMeta';

/** The shell as Quasar emits it: minified, comments stripped, quotes dropped. */
const SHELL =
  '<!doctype html><html><head><title>Camp Registrations</title>' +
  '<meta charset=utf-8><meta name=description content="Manage camp registrations">' +
  '</head><body><div id=q-app></div></body></html>';

const meta: PageMeta = {
  title: 'Sommerlager',
  siteName: 'Camp Registrations',
  description: 'Berlin',
  url: 'https://example.org/events/1',
};

const directory = path.join(os.tmpdir(), `meta-route-${process.pid}`);
const shellPath = path.join(directory, 'index.html');
const brokenShellPath = path.join(directory, 'broken.html');
const missingShellPath = path.join(directory, 'absent.html');

const serve = (resolve: PageMetaResolver, indexPath = shellPath) => {
  const app = express();

  app.get('/page', metaRoute(resolve, indexPath));
  // Stands in for the SPA shell handler this route falls through to.
  app.get('/page', (_req, res) => {
    res.type('html').send(SHELL);
  });

  return supertest(app);
};

beforeAll(async () => {
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(shellPath, SHELL);
  await fs.writeFile(brokenShellPath, '<html><body>no head</body></html>');
});

afterAll(async () => {
  await fs.rm(directory, { recursive: true, force: true });
});

describe('metaRoute', () => {
  it('rewrites the head when the resolver returns meta', async () => {
    const { text } = await serve(() => meta)
      .get('/page')
      .expect(200);

    expect(text).toContain('<title>Sommerlager</title>');
    expect(text).toContain('<meta property="og:title" content="Sommerlager">');
    expect(text).toContain('<div id=q-app></div>');
  });

  it('awaits an asynchronous resolver', async () => {
    const { text } = await serve(() => Promise.resolve(meta))
      .get('/page')
      .expect(200);

    expect(text).toContain('<title>Sommerlager</title>');
  });

  it('falls through when the resolver declines', async () => {
    const { text } = await serve(() => null)
      .get('/page')
      .expect(200);

    expect(text).toBe(SHELL);
  });

  it('falls through when there is no build to rewrite', async () => {
    const { text } = await serve(() => meta, missingShellPath)
      .get('/page')
      .expect(200);

    expect(text).toBe(SHELL);
  });

  it('falls through when the shell is unrecognised', async () => {
    const { text } = await serve(() => meta, brokenShellPath)
      .get('/page')
      .expect(200);

    expect(text).toBe(SHELL);
  });

  it('falls through instead of erroring when the resolver throws', async () => {
    const { text } = await serve(() => {
      throw new Error('boom');
    })
      .get('/page')
      .expect(200);

    expect(text).toBe(SHELL);
  });

  it('marks the page cacheable and language dependent', async () => {
    const { headers } = await serve(() => meta)
      .get('/page')
      .expect(200);

    expect(headers['cache-control']).toBe('public, max-age=300');
    expect(headers.vary).toContain('Accept-Language');
  });

  it('caches each shell separately', async () => {
    // A stale entry keyed only by mtime would serve one shell for the other.
    const rendered = await serve(() => meta)
      .get('/page')
      .expect(200);
    const declined = await serve(() => meta, brokenShellPath)
      .get('/page')
      .expect(200);

    expect(rendered.text).toContain('<title>Sommerlager</title>');
    expect(declined.text).toBe(SHELL);
  });
});
