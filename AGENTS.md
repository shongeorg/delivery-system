# AGENTS.md

## Layout

- No root `package.json` or workspace. Five independent npm projects, each with its own lockfile and `node_modules`; install and run commands from inside each directory.
- `backend` Hono API on 3000 · `frontend` SvelteKit on 3031 · `courier-app` Vue 3 PWA on 3032 · `сhef-panel` React on 3033 · `ower-panel` React on 3034.
- `сhef-panel` begins with Cyrillic `с` (U+0441), not ASCII `c`. Quote or paste the path; `?hef-panel` in shell output is only a console encoding artifact.
- `README.md` and `docs/*.md` describe the current system. `QWEN.md`, `CLAUDE.md`, and `project.*.spec.md` are historical and may contradict the code. Trust `vite.config.*`, `package.json`, and `docs/`.

## Commands

Run from each app directory:

| App | Commands |
|-----|----------|
| `backend` | `npm run dev`, `npm run build`, `npm run start`, `npm run db:push`, `npm run db:generate`, `npm run db:seed`, `npm run db:clear`, `npm test` |
| `frontend` | `npm run dev`, `npm run build`, `npm run check`, `npm run test:unit`, `npm run test:e2e`, `npm test` |
| `courier-app` | `npm run dev`, `npm run build`, `npm run preview` |
| `сhef-panel` | `npm run dev`, `npm run build`, `npm run lint` |
| `ower-panel` | `npm run dev`, `npm run build` |

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
- Drizzle uses the Neon HTTP driver (`drizzle-orm/neon-http`). All 22 tables are in `src/db/schema.ts`. `drizzle/` is gitignored and no migrations are committed, so apply schema changes with `npm run db:push`.
- JWT secrets are captured at module load in `src/utils/auth.ts`; `dotenv` is loaded by imports (`db/index.ts`, `index.ts`). Env must be present before startup, and import order matters when refactoring.
- Response shapes are inconsistent: `/products` and `/categories/:slug` return an object with `pagination`; `/categories`, `/tags`, `/orders`, `/orders/my`, and `/inventory` return bare arrays. Read the handler before writing a client.
- CORS is a hard-coded allowlist for localhost ports 3000, 3031, 3032, 3033, 3034 in `src/index.ts`; add any new dev origin there.
- Realtime envelope is `{ type, data }` (`src/websocket.ts`); clients read `message.type`. `PATCH /orders/:id/status` broadcasts `order_updated` both globally and to `order:<id>`; `PUT /orders/:id/location` and the WS `courier_location_update` share `src/services/tracking.ts`; chat emits `chat_message` to the order channel. `order:<id>` subscriptions are access-checked; the `orders` channel is accepted but has no separate routing.
- Order tracking/chat details are in `docs/TRACKING-AND-CHAT.md`; the status matrix and role rules are in `docs/ORDER-LIFECYCLE.md`.
- One-off scripts at the backend root (`test-*.ts`, `create-*.ts`, `check-orders.ts`, etc.) run with `npx tsx <file>`. They sit outside `tsconfig` (`rootDir: src`) and are not built or typechecked.

## Frontend

- Svelte 5 with runes forced for all non-`node_modules` files (`svelte.config.js`). Use `$state`, `$props`, `$derived`, `$effect`, and `onclick`; legacy `export let` is rejected in runes mode.
- `PUBLIC_API_URL` comes from `$env/static/public` (`src/lib/api.ts`). No `.env` is committed; copy `frontend/.env.example` to `frontend/.env`.
- Auth tokens are stored in `localStorage` as `accessToken` and `refreshToken`; `apiFetch` attaches the bearer header manually. Backend auth is header-based, not cookie-based.

## Panels

- Courier and chef panels hard-code `http://localhost:3000` (`courier-app/src/api/client.js`, `сhef-panel/src/api/axios.ts`). The chef Vite `/api` proxy is not used by its API client.
- Chef panel requires role `owner`, `admin`, or `chef` at the router level (`src/components/RoleGuard.tsx`). Owner panel requires `owner` in its UI guard while `/owner/*` API allows `owner` and `admin`.
- Courier app, frontend, and owner panel all retry one request after a `401` via `/auth/refresh`; chef panel uses the same interceptor in `сhef-panel/src/api/axios.ts`.

## Specs

- `project.*.spec.md` are design documents. Where they conflict with code, the code wins.
