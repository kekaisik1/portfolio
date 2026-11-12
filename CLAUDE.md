# Portfolio site

Vite + strict TypeScript, no framework. "Departures": a board of ten places on the left, one full-bleed photograph of the current place on the right, and a hard slat cut between them; see README.md for the map. On phones the photo is the whole screen and the board is a sheet.

## Commands

- `npm run dev` — dev server (no API unless `.env` sets `VITE_API_URL`)
- `npm run check` — lint + typecheck + unit tests + build. Run before every commit.
- `npm run test:e2e` — Playwright smoke suite against the real build under `/portfolio/` (rebuild first if a preview server is already running on 4173: it is reused)
- `npm run format` — prettier
- `npm run worlds -- <folder>` — make `public/worlds/*.webp` (landscape + upright crop per world) and `src/worlds/placeholders.json` from the source photographs (needs ffmpeg with libwebp). Run after changing a photo or a world's `focus` in `src/worlds/looks.ts`; commit the results. A unit test caps every file's size.
- `npm run video -- <file> <slug>` — compress a video into `public/videos/<slug>.mp4` (H.264, 720p, at most 2 MB). Every video goes in this way, never as a raw copy: recorders write HEVC, which Firefox can't play, and a unit test fails above 2 MB.

## Conventions

- All text lives in `src/content/` (projects, the board's places and status words, messages). Never hard-code copy in DOM code or in `index.html`: the shell has `{{slots}}` filled by `content/render.ts` at build time.
- One project = one entry in `content/projects.ts` + its place in `content/places.ts` + its look in `worlds/looks.ts` + its photograph (`scripts/make-worlds.ts` maps source file to world id). Unit tests fail until all four exist. Slugs are public (links, photo and video names, API growth keys): don't rename.
- The photo is the hero. Words stand in the corner the photo leaves calm (`looks.ts`: `at`, `width`, `x`, `atTall`), with only a local shade behind them: never a scrim over the photo. After changing a look or a text, look at screenshots of that world at 1440x900, 1366x680, 390x844 and 320x568.
- Performance rules (the previous site lagged): animate only `transform` and `opacity`; no blend modes, filters, backdrop-filter or clip-path on big layers; at most three photos mounted (`worlds/photos.ts`); the only frame loop is the small ambient canvas (`ambient/ambient.ts`), which stops when nothing is visible; no scroll smoothing: travel is one step per gesture. A photo is shown only after `img.decode()`.
- Words must be readable about 300 ms after a key: the cut is 300 ms (`worlds/slats.ts`), and nothing may delay the words after it lands.
- Modules that touch the DOM at import (`lib/media.ts` and whatever imports it) cannot be unit-tested in jsdom; keep logic worth testing in DOM-free modules (`content/*`, `worlds/cover.ts`, `slats.ts`, `looks.ts`, `travel/gesture.ts`, `board/scramble.ts`, `nav/routing.ts`, `note/machine.ts`, `night/today-text.ts`, `lantern-math.ts`, `video/files.ts`, `lib/queries.ts`).
- Narrow layout = phones and upright tablets: `NARROW_QUERY`/`TALL_QUERY` in `lib/queries.ts` and the media queries in `styles/narrow.css` must agree (a unit test checks).
- No `any`, no non-null assertions, no bare `catch`: catch the specific error type and rethrow the rest. API failures are values (`ApiResult`), handled per endpoint; responses are checked with Zod.
- Never call the production API from tests or while verifying. The e2e suite fails on any request that leaves 127.0.0.1.
- CSS: one file per concern in `src/styles/`, colours and type from `tokens.css`. `narrow.css` then `motion.css` (reduced motion) must stay after the files they override.
- Accessibility is part of parity: skip link, keyboard travel (the board is one Tab stop), focus moved to the new world's name, `aria-live` arrival line, modal dialogs for the video / Read / the note (Esc, focus return), 44 px targets, reduced motion = instant cuts and no canvas.
