---
description: Run the same gates CI does, in CI's order, and report what fails.
---

Verify the working tree against the checks CI will run on the PR. Run the stages
in order and **do not stop at the first failure** — run every stage, then report
all failures together, since fixing one at a time costs a full round trip.

Scope: if the user named a workspace in `$ARGUMENTS`, run only that workspace's
stages (plus stage 1, which everything depends on). Otherwise run all of them.

1. **Build common** — `npm run build --workspace common`.
   Everything downstream resolves types from `common/dist`; a stale build makes
   later stages fail for the wrong reason. If this fails, stop: the rest is noise.

2. **Migrations reproduce the schema** (only if `backend/prisma/` changed) —
   from `backend/`:
   `npx prisma migrate diff --exit-code --from-migrations prisma/migrations --to-schema prisma/schema.prisma`

3. **Typecheck** — `npm run typecheck --workspaces --if-present`.

4. **Lint** — `npm run lint --workspaces --if-present`.
   (The frontend's `lint` includes `i18n:check`, which gates locale completeness.)

5. **Format** — `npm run format:check --workspaces --if-present`.
   On failure, run `npm run format --workspaces --if-present` rather than
   hand-editing whitespace, then re-check.

6. **Tests** — `npm run test --workspace common`,
   `npm run test --workspace frontend`, `npm run test --workspace backend`.
   The backend suite includes integration tests, which need MariaDB on port 3307
   and Redis. If they aren't up, say so and run `npm run test:unit --workspace backend`
   instead — report clearly that integration tests were skipped, don't silently
   narrow the gate.

E2E is **not** part of this command: it needs production builds of all three
workspaces plus MariaDB and MailDev. Mention it if the change touches user-facing
flows, but don't run it unless asked.

Report as a short pass/fail list per stage, then the failure details. If everything
passes, say so in one line — no summary of what each stage does.
