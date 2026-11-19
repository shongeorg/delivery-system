# AGENTS.md

## Layout

- No root `package.json` or workspace. Four independent npm projects, each with its own lockfile and `node_modules`; install and run commands from inside each directory.
- `backend` Hono API on 3000 · `frontend` SvelteKit on 3031 · `courier-app` Vue 3 PWA on 3032 · `сhef-panel` React on 3033. `ower-panel/` is an empty placeholder for the owner panel (port 3034 is reserved in backend CORS).
- `сhef-panel` begins with Cyrillic `с` (U+0441), not ASCII `c`. Quote or paste the path; `?hef-panel` in shell output is only a console encoding artifact.
- Root `README.md` and `QWEN.md` are stale (README says frontend/courier are "coming soon"; QWEN says frontend runs on 1212). Trust `vite.config.*` and `package.json`. `CLAUDE.md` documents the backend and courier app, not the panels.

## Commands

Run from each app directory:

| App | Commands |
|-----|----------|
| `backend` | `npm run dev`, `npm run build`, `npm run start`, `npm run db:push`, `npm run db:generate`, `npm run db:seed`, `npm run db:clear`, `npm test` |
| `frontend` | `npm run dev`, `npm run build`, `npm run check`, `npm run test:unit`, `npm run test:e2e`, `npm test` |
| `courier-app` | `npm run dev`, `npm run build`, `npm run preview` |
| `сhef-panel` | `npm run dev`, `npm run build`, `npm run lint` |

- `backend` `db:clear` deletes all data except `owner`/`admin` users; it is not product-only.
- `сhef-panel` has no committed ESLint config, so `npm run lint` fails until one is added. Use `npm run build` (`tsc -b && vite build`) for verification.
- There is no CI, pre-commit hook, or root task runner.

## Tests are not hermetic

- Backend `npm test` is Vitest, but `src/tests/api.test.ts` uses `fetch` against `http://localhost:3000`. Start `npm run dev` and use a seeded database first; the tests write to that database.
- That suite has a stale assertion: `/products` now returns `{ products, pagination }`, while the test expects an array. Do not treat a failing suite as a pre-existing clean baseline.
- Frontend e2e has `baseURL` 3031 and no Playwright `webServer`; start `npm run dev` before `npm run test:e2e`. Only files under `frontend/tests/` are collected; `src/routes/demo/playwright/page.svelte.e2e.ts` is outside `testDir`.
- Frontend unit tests run in real Chromium via Playwright. `*.svelte.spec.ts` go to the browser project; other `*.spec.ts` go to the node project.

## Backend

- Each documented endpoint exists twice: `src/routes/*` mounted at the root (`/auth/login`) and `src/openapi/*` mounted under `/api` (`/api/auth/login`). The OpenAPI handlers re-implement the logic rather than delegating. Update both or the docs drift. Scalar UI is at `/api/docs`, spec at `/api/docs/openapi.json`.
- NodeNext ESM: relative imports need the `.js` suffix (`./db/schema.js`) even inside `.ts` files.
- Drizzle uses the Neon HTTP driver (`drizzle-orm/neon-http`). All 16 tables are in `src/db/schema.ts`. `drizzle/` is gitignored and no migrations are committed, so apply schema changes with `npm run db:push`.
- JWT secrets are captured at module load in `src/utils/auth.ts`; `dotenv` is loaded by imports (`db/index.ts`, `index.ts`). Env must be present before startup, and import order matters when refactoring.
- Response shapes are inconsistent: `/products` and `/categories/:slug` return an object with `pagination`; `/categories`, `/tags`, `/orders`, `/orders/my`, and `/inventory` return bare arrays. Read the handler before writing a client.
- CORS is a hard-coded allowlist for localhost ports 3000, 3031, 3032, 3033, 3034 in `src/index.ts`; add any new dev origin there.
- Realtime envelope: backend sends `{ type: event, data }` (`src/websocket.ts`), but `courier-app/src/stores/socket.js` reads `data.event`. Only the Stripe webhook broadcasts `order_updated`; ordinary status changes do not. Verify both sides before relying on live updates.
- One-off scripts at the backend root (`test-*.ts`, `create-*.ts`, `check-orders.ts`, etc.) run with `npx tsx <file>`. They sit outside `tsconfig` (`rootDir: src`) and are not built or typechecked.

## Frontend

- Svelte 5 with runes forced for all non-`node_modules` files (`svelte.config.js`). Use `$state`, `$props`, `$derived`, `$effect`, and `onclick`; legacy `export let` is rejected in runes mode.
- `PUBLIC_API_URL` comes from `$env/static/public` (`src/lib/api.ts`). No `.env` is committed; copy `frontend/.env.example` to `frontend/.env`.
- Auth tokens are stored in `localStorage` as `accessToken` and `refreshToken`; `apiFetch` attaches the bearer header manually. Backend auth is header-based, not cookie-based.

## Panels

- Courier and chef panels hard-code `http://localhost:3000` (`courier-app/src/stores/auth.js`, `сhef-panel/src/api/axios.ts`). The chef Vite `/api` proxy is not used by its API client.
- Chef panel requires role `owner`, `admin`, or `chef` at the router level (`src/components/RoleGuard.tsx`).

## Specs

- `project.*.spec.md` are design documents. Where they conflict with code, the code wins.
