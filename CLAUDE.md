# Portfolio site

Vite + strict TypeScript, no framework. A canvas-drawn pencil journey with seven places; see README.md for the map.

## Commands

- `npm run dev` — dev server (no API unless `.env` sets `VITE_API_URL`)
- `npm run check` — lint + typecheck + unit tests + build. Run before every commit.
- `npm run test:e2e` — Playwright smoke suite against the real build under `/portfolio/` (rebuild first if a preview server is already running on 4173: it is reused)
- `npm run format` — prettier
- `npm run video -- <file> <slug>` — compress a video into `public/videos/<slug>.mp4` (H.264, 720p, at most 2 MB). Every video goes in this way, never as a raw copy: recorders write HEVC, which Firefox can't play, and a unit test fails above 2 MB.

## Conventions

- All text lives in `src/content/`. Never hard-code copy in drawing or DOM code.
- One project = one content entry + `src/places/<slug>.ts` + `src/rooms/<slug>.ts`, registered in the two `index.ts` files. Slugs are public (links, video names, API growth keys): don't rename.
- The drawings are seeded: changing the order of random calls, a seed, or the project order changes every pencil line. Port and edit drawing code without reordering `rnd()` calls.
- Drawing code in `src/world/draw/` is pure (takes a context). Shared mutable state is only `S` in `src/world/state.ts` and `pen` in `draw/sketch.ts`.
- Modules that touch the DOM at import (`world/dom.ts` and whatever imports it) cannot be unit-tested; keep logic worth testing in DOM-free modules (`zones.ts`, `nav/routing.ts`, `note/machine.ts`, `today-text.ts`, `places/size.ts`).
- No `any`, no non-null assertions, no bare `catch`: catch the specific error type and rethrow the rest. API failures are values (`ApiResult`), handled per endpoint.
- Per-frame code allocates nothing and reads no layout. Static things are drawn once into kept canvases.
- Never call the production API from tests or while verifying. The e2e suite fails on any request that leaves 127.0.0.1.
- CSS: one file per concern in `src/styles/`, colours and type from `tokens.css`. `motion.css` (reduced motion) must stay after the files it overrides.
- Accessibility is part of parity: keyboard travel, focus return when leaving a place, Esc/Back, 44 px targets, reduced motion, `aria-live` on the note status.
