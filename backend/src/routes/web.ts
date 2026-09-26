import { createRouter } from '#core/router/router';
import extensions from '#middlewares/extension.middleware';

/**
 * Browser-facing routes served outside `/api/v1`, filled by modules through
 * `AppModule.registerWebRoutes()`.
 *
 * Mounted by `#routes/static` after the API and ahead of the SPA shell, so a
 * route here answers a path the shell would otherwise swallow — a link preview,
 * a redirect, a download. Anything it declines falls through to the shell, which
 * is what makes the SPA's own routing still work for every other path.
 */
const router = createRouter();

// Router-level, and here rather than in each module: route-model bindings are
// applied to every router `createRouter()` makes and call `req.setModel`, which
// this installs — and they run before a route's own handlers, so a module
// mounting it itself would be too late.
router.use(extensions);

export default router;
