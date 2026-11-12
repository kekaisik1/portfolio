# Portfolio

A watercolour walk through mountains, steppe, sea and night. You scroll forward into the landscape; each of the seven projects is something standing in it (a hut, a yurt, a lighthouse…), with a small label beside it. Open the label and the finished painting of that place fills the screen, with the project's words, a short video if there is one, and its link on a sheet of paper. Then about, contact, "leave a note" and a string of lanterns.

The one design reference is the David Whyte Experience (davidwhyte.com/experience): its structure and pace (separate painted pieces on paper fog, ~460 px of scroll per place, words on bare paper, a paper-grain dissolve, pieces first and the whole painting on a click), not its look.

Live: https://kekaisik1.github.io/portfolio/

## Run it

Node 20 or newer.

```bash
npm install
npm run dev        # http://localhost:5173, no API: the page runs on its own
npm run check      # lint + typecheck + unit tests + build (what CI runs)
npm run test:e2e   # browser smoke suite against the real build (first time: npx playwright install chromium)
npm run build      # dist/, to be served from /portfolio/
npm run preview    # serves dist/ at http://localhost:4173/portfolio/
npm run paint      # bake the paintings again after changing a painter (see below)
```

Other scripts: `lint`, `typecheck`, `test`, `format`.

## How it is put together

Vite + TypeScript (strict), no UI framework: real HTML words over painted cut-outs that are moved with transforms, so plain modules are the right size.

```
index.html            the page shell: meta, the painting's layers, dialogs, slots the words are written into at build time
src/main.ts           start-up: wires the parts together
src/content/          every word on the page (projects, about, contact, messages) and how it becomes HTML
src/scene/            what stands where: the stops of the walk (stops.ts), the cut-outs (objects.ts), the finished
                      paintings of each country (compose.ts); pure data and maths
src/paint/            the painter: layered SVG washes (painter.ts, motifs.ts), one painter per kind (kinds/<country>.ts),
                      rasterising (raster.ts), the noise, dissolve masks and paper textures (noise.ts, masks.ts),
                      and the baked paintings (baked.ts + baked.json, quality.ts, hash.ts)
src/journey/          walking: camera and depth (camera.ts), the frame loop (frame.ts), when words, labels and pieces
                      come and go (timing.ts), where labels stand (labels.ts, layout.ts), painting nearest first
src/inside/           going into a place: the finished painting blooming in (painting.ts), the dialog, focus, Back/Esc
                      (inside.ts), the video frame (video.ts)
src/night/            lanterns, and the weather / "last seen working on" lines from the API
src/nav/              arrow keys, the horizon bar's links, #links and the address
src/api/              typed client for the optional API; every response is checked with Zod
src/note/             the note form: validation, a small state machine, the form itself
src/styles/           CSS by concern; palette and type are custom properties in tokens.css; narrow.css is phones and
                      upright tablets
scripts/              build helpers: the video manifest, and `npm run paint` (bake-paint.ts + bake.html)
public/               fonts, og.jpg, videos, paint/ (the baked paintings and paper textures)
tests/unit  tests/e2e
```

The words are written into `index.html` when the page is built (`vite.config.ts` → `src/content/render.ts`), so every project, its text and its link are in the page without JavaScript, for search engines and screen readers. Each stop stands at its own scroll position (stop i at i × 460 px), so a `#link` lands there even before the script runs.

### The paintings

Everything is painted by code: each kind (`peaks`, `shed`, `lighthouse`, …) is a seeded painter that builds overlapping SVG washes with ragged edges, pooled rims, granulation and dry-brush gaps. Rendering those SVG filters takes a real browser and up to a few hundred milliseconds each, so the site ships them **baked**: `npm run paint` paints every kind once in Chromium (through the Vite dev server) and writes `public/paint/<kind>.webp`, the paper grain and torn edges as PNGs, and `src/paint/baked.json` (size, quality, the painter's fingerprint, and where each painting has paint, for placing labels). The page decodes those, nearest stop first; a place's finished painting is fetched when you arrive at it. A kind with no baked file is painted live in the browser, which is what happens in development right after you change a painter.

A unit test fingerprints every painter and fails when `baked.json` no longer matches: after changing anything under `src/paint/` (or `quality.ts`, or a cut-out's height), run `npm run paint` and commit `public/paint/` and `baked.json`. Seeds matter: changing a seed or the order of random calls changes the painting.

## Add a project

1. Add an entry to `src/content/projects.ts` (slug, group `work`/`play`, zone, name, a line of at most 60 characters, the hover line, inside text, optional note and link).
2. Stand it in the landscape: one cut-out with its `slug` in `src/scene/objects.ts`, painted by a kind in `src/paint/kinds/<country>.ts` (the stops after it move one along).
3. Run `npm run paint`.

The unit tests fail until every project has exactly one cut-out and every painting is baked. Slugs are public: they are `#links`, video file names and the keys of the API's growth numbers.

## Add a video

Run `npm run video -- <your file> <slug>` (needs ffmpeg). It writes `public/videos/<slug>.mp4` as H.264 + AAC at 720p and at most 2 MB, which every browser plays and a phone loads quickly; a unit test fails on a bigger file, so don't copy a raw recording in. Optional captions go beside it as `public/videos/<slug>.vtt`. Commit both. The list of videos is made at build time; a project without one shows a small empty frame that says so. Keep it understandable with the sound off, and restart `npm run dev` after adding a file.

## Environment

See `.env.example`.

- `VITE_API_URL` — address of the small API (private `portfolio-api` repo, on Railway) behind lanterns, notes, weather and the "last seen working on" line. Empty = the page runs on its own: nothing is sent anywhere, lanterns stay in the browser, and "leave a note" says it didn't go through and gives the email. Production's value is set in `.github/workflows/pages.yml`.
- `VITE_LOCAL_API_PORT` — on `localhost`, when `VITE_API_URL` is set, the page talks to a local copy of the API on this port (default 8787) instead of the real one.

Tests never use the real API: unit tests mock `fetch`, and the smoke suite builds with no address and fails if any request leaves the machine.

## Good to know

- Links can point at a country or a place: `…/portfolio/#sea`, `…/portfolio/#emberquill`. The address follows the country you are in, and going inside a place adds a step that Back undoes. Links from the old site (`#voice-receptionist`, `#crm`, `#data-assistant`) land on the place that took them over (`src/nav/routing.ts`).
- The two typefaces (Newsreader for words, Familjen Grotesk for small labels; Latin part only, SIL Open Font License) are served from `public/fonts/`. To change one, replace the `.woff2` files and `src/styles/fonts.css`.
- `public/og.jpg` is the picture shown when the link is pasted somewhere: the first screen at 1200×630, without the horizon bar. Retake it if the first screen changes.
- Deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`, after the checks pass.
