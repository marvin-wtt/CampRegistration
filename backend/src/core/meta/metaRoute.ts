import type { Request, RequestHandler } from 'express';
import fs from 'node:fs/promises';
import { injectPageMeta, type PageMeta } from '#utils/pageMeta';
import { spaIndexPath } from '#utils/paths';
import logger from '#core/logger';

type MaybePromise<T> = T | Promise<T>;

/**
 * What a page's `<head>` should say, or `null` for "not mine".
 *
 * ⚠️ Must not depend on who is asking. The rendered page is cached publicly and
 * shared between viewers, so a resolver that reads the session — permissions,
 * roles, cookies — can hand one viewer's page to the next. Decide from the
 * resource alone, and return `null` when it may not be shown anonymously.
 */
export type PageMetaResolver = (req: Request) => MaybePromise<PageMeta | null>;

const cache = new Map<string, { mtimeMs: number; html: string }>();

/**
 * The built HTML document, re-read whenever it changes on disk.
 *
 * The `stat` is what makes a dev rebuild of the frontend show up without
 * restarting the API; in a container the file cannot change at all, so the read
 * happens once. A reverse proxy cannot stand in for this — it caches responses,
 * not our own build artefact.
 */
async function loadDocument(indexPath: string): Promise<string | null> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const { mtimeMs } = await fs.stat(indexPath);
    const cached = cache.get(indexPath);
    if (cached?.mtimeMs === mtimeMs) {
      return cached.html;
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const html = await fs.readFile(indexPath, 'utf8');
    cache.set(indexPath, { mtimeMs, html });

    return html;
  } catch {
    // No build to rewrite (dev server, or a broken deploy): fall through.
    return null;
  }
}

/**
 * Serves the SPA shell with its `<head>` rewritten for one page, so a link
 * pasted into WhatsApp, Slack or Signal previews the page rather than the
 * product name. Crawlers never run the SPA, which is why this happens here.
 *
 * Every way of not producing a page — the resolver declines, there is no build,
 * the shell is unrecognised, something throws — continues to the next handler,
 * which serves the shell unchanged. A preview is therefore never wrong, only
 * ever absent, and a path that the SPA owns keeps working.
 */
export function metaRoute(
  resolve: PageMetaResolver,
  indexPath: string = spaIndexPath(),
): RequestHandler {
  return async (req, res, next) => {
    try {
      const meta = await resolve(req);
      if (meta === null) {
        next();
        return;
      }

      const document = await loadDocument(indexPath);
      if (document === null) {
        next();
        return;
      }

      const html = injectPageMeta(document, meta);
      if (html === null) {
        next();
        return;
      }

      res
        .type('html')
        .set('Cache-Control', 'public, max-age=300')
        .set('Vary', 'Accept-Language')
        .send(html);
    } catch (error) {
      // Nothing above is expected to throw. Degrade to the plain shell rather
      // than error the page, but say so — a preview that silently stops
      // working has no other symptom.
      logger.warn(
        `Failed to render page meta for ${req.originalUrl}: ${String(error)}`,
      );

      next();
    }
  };
}
