# Choplife (meal planner)

Shared meal planner for two people with opposite calorie goals: one meal cooked, two portions. Mobile-first PWA. React 19 + Vite + TypeScript on Cloudflare Pages Functions + D1, with a separate cron Worker for push reminders.

## Commands
- Dev (two terminals): `npm run dev:api` (API on 8787, in-memory DB) and `npm run dev` (Vite, proxies /api)
- Build and serve everything locally: `npm run build && npm run serve` (http://localhost:4173; `DB_PATH=./local.db` keeps data)
- Typecheck: `npm run typecheck`; lint: `npm run lint` (fix: `npm run lint:fix`); format: `npm run format`
- Unit and API tests: `npm test`; browser tests and screenshots: `npm run test:e2e` (uses /usr/bin/google-chrome, override with CHROME_PATH)
- All quick checks: `npm run check`
- Deploy steps: `docs/DEPLOY.md`

## Layout
- `shared/`: types and pure logic (nutrition, portions, rules, engine, shopping, moods, starter dishes, train: gym maths and rule-based sport coach). Used by client, server and worker. Keep it free of DOM and Node APIs.
- `server/`: API handler (`handler.ts`), validation, crypto, `node-d1.ts` (node:sqlite stand-in for D1 in tests and local runs), `dev.ts`.
- `functions/api/[[path]].ts`: Pages Function entry. `workers/`: reminder cron. `migrations/`: D1 SQL.
- `src/`: `lib/` (api, store with offline queue, router, actions), `components/`, `screens/`, `styles/`.

## Rules
- A Stop hook (`scripts/stop-check.sh`) runs typecheck and lint and blocks finishing if they fail.
- TypeScript is pinned to 6.0.x because typescript-eslint does not support 7 yet. ESLint is pinned to 9 for jsx-a11y.
- Every household query must filter by `household_id`. Add an isolation test for any new route.
- Recipe calories and ingredient amounts are per ONE standard serving. Portions scale per person (0.25x steps, 0.5x to 2.5x). Shopping quantities use the sum of the household's multipliers.
- Destructive actions use an undo toast. Only irreversible ones (leave household, delete account) use the Confirm sheet. No native confirm dialogs.
- Spec, brief and reference meals live in the Claude Project "just building" under `meal-planner/`.

## Fonts and style (final)
"Hand-crafted paper" look. Fonts are self-hosted through @fontsource, no CDN:
- Display: Gloock (headings, big numbers). Body: Atkinson Hyperlegible. Labels: Special Elite (small caps-style typewriter labels).
- Palette (CSS variables in `src/styles/tokens.css`): paper `#f4ecdb`, paper-2 `#ece1c8`, paper-edge `#d8c9a8`, ink `#2b2219`, ink-soft `#5e5040`, one accent stamp red `#c0421b` (dark `#9c3414`), person colours teal `#1f5c55` (first person) and plum `#6b2f55` (second), ok `#35692f`, warn `#8a5208` (darkened to pass AA on paper).
- Signature details: rubber "EATEN" stamp when a meal is marked eaten, torn-ticket portion stubs per person, masking-tape corners on key cards, hard offset shadows on buttons, paper-grain background.
- Type scale 12/14/16/18/22/28/36; radius 2px (pills 999px); compact controls (34px mobile, 28px desktop; user wants small buttons and icons); motion respects prefers-reduced-motion.
- Must stay different from other projects: Big Shoulders Display, Manrope, JetBrains Mono (Reel); Bungee, Bungee Shade, Chakra Petch, Bowlby One, Figtree (Game Night); and Inter, Roboto, Arial, system fonts.
