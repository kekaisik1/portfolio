# Portfolio site

Vite + strict TypeScript, no framework. A code-painted watercolour journey with seven places; see README.md for the map. The one design reference is the David Whyte Experience (`~/Desktop/work/reference/library/web/david-whyte-experience.md`).

## Commands

- `npm run dev` — dev server (no API unless `.env` sets `VITE_API_URL`)
- `npm run check` — lint + typecheck + unit tests + build. Run before every commit.
- `npm run test:e2e` — Playwright smoke suite against the real build under `/portfolio/` (rebuild first if a preview server is already running on 4173: it is reused)
- `npm run format` — prettier
- `npm run paint` — bake every painting into `public/paint/` + `src/paint/baked.json` (needs the Playwright Chromium). Run after changing anything under `src/paint/`, `scene/objects.ts` heights or `paint/quality.ts`; a unit test fails until you do. Commit the baked files.
- `npm run video -- <file> <slug>` — compress a video into `public/videos/<slug>.mp4` (H.264, 720p, at most 2 MB). Every video goes in this way, never as a raw copy: recorders write HEVC, which Firefox can't play, and a unit test fails above 2 MB.

## Conventions

- All text lives in `src/content/`. Never hard-code copy in drawing or DOM code.
- One project = one content entry + one cut-out with its slug in `src/scene/objects.ts` (painted by a kind in `src/paint/kinds/`), then `npm run paint`. Slugs are public (links, video names, API growth keys): don't rename.
- The paintings are seeded: changing a seed or the order of `rnd()` calls changes the painting (and its fingerprint). Painters (`paint/painter.ts`, `motifs.ts`, `kinds/`) only build SVG strings; they never touch the DOM.
- Never paint on the main thread at start-up: the site loads baked WebPs. SVG filters, `getImageData` on big canvases and `toDataURL` are each hundreds of ms on a phone. Live painting is only the fallback for a kind without a baked file.
- Shared mutable state is only `S` in `journey/state.ts` and `W` in `journey/world.ts`.
- Modules that touch the DOM or a canvas at import (`journey/dom.ts`, `paint/masks.ts`, `paint/raster.ts` and whatever imports them) cannot be unit-tested in jsdom; keep logic worth testing in DOM-free modules (`scene/*`, `journey/camera.ts`, `timing.ts`, `labels.ts`, `paint/svg-of.ts`, `hash.ts`, `baked.ts`, `nav/routing.ts`, `note/machine.ts`, `night/today-text.ts`).
- Narrow layout (words on top, scene below) = phones and upright tablets: `isNarrow` in `journey/camera.ts` and the media query in `styles/narrow.css` must agree.
- The words never sit over paint, and the frame is never wordless: keep `journey/timing.ts`'s rules and their tests when retiming anything.
- No `any`, no non-null assertions, no bare `catch`: catch the specific error type and rethrow the rest. API failures are values (`ApiResult`), handled per endpoint.
- Per-frame code allocates nothing and reads no layout. Static things are drawn once into kept canvases.
- Never call the production API from tests or while verifying. The e2e suite fails on any request that leaves 127.0.0.1.
- CSS: one file per concern in `src/styles/`, colours and type from `tokens.css`. `motion.css` (reduced motion) must stay after the files it overrides.
- Accessibility is part of parity: keyboard travel, focus return when leaving a place, Esc/Back, 44 px targets, reduced motion, `aria-live` on the note status.
