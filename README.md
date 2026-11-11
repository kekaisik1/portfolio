# Portfolio

A pencil journey through mountains, steppe, sea and night sky. Each of the seven projects is a place in the landscape; tap one to go inside it (its words, a short video if there is one, its link). Then about, contact and "leave a note".

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
```

Other scripts: `lint`, `typecheck`, `test`, `format`.

## How it is put together

Vite + TypeScript (strict), no UI framework: the page is one canvas-drawn picture with real HTML words on top, so plain modules are the right size.

```
index.html            the page shell: meta, dialogs, slots the words are written into at build time
src/main.ts           start-up: wires the parts together
src/content/          every word on the page (projects, about, contact, messages) and how it becomes HTML
src/world/            the landscape engine
  state.ts            the one mutable state of the journey
  zones.ts            where you are (0 mountains .. 3 night) and the time of day; pure math
  layout.ts           measures the page; decides how far the journey runs and where things stand
  layers.ts tiles.ts  four parallax layers of land, drawn once into cached strips
  scene.ts            one frame: day, night, the dusk between
  company.ts life.ts weather.ts haze.ts lanterns.ts sprites.ts   everything that moves
  loop.ts scheduler.ts  the frame loop; it stops when the tab is hidden or motion is reduced
  draw/               pencil primitives (stroke, hatch, wash, the sketch builder); pure functions taking a context
src/places/<slug>.ts  one drawing per project: the scene on its three sheets and its small moving part
src/places/view.ts    how a place is painted: kept sheets + one live sheet, stacked canvases
src/rooms/<slug>.ts   one room per project: what you see inside
src/inside/           going in and out (transition, focus, Back/Esc), the paper, the video frame
src/nav/              the horizon line, arrow keys, #links
src/api/              typed client for the optional API; every response is checked with Zod
src/note/             the note form: validation, a small state machine, the form itself
src/styles/           CSS by concern; palette and type are custom properties in tokens.css
scripts/              build helpers (the video manifest)
public/               fonts, og.jpg, videos
tests/unit  tests/e2e
```

The words are written into `index.html` when the page is built (`vite.config.ts` → `src/content/render.ts`), so every project, its text and its link are in the page without JavaScript, for search engines and screen readers. With JavaScript the text is read inside the place and stays in the page for assistive technology.

## Add a project

1. Add an entry to `src/content/projects.ts` (slug, group `work`/`play`, zone, name, a line of at most 60 characters, inside text, optional note and link).
2. Draw it: `src/places/<slug>.ts` exports `place` (see any existing one), registered in `src/places/index.ts`.
3. Draw its room: `src/rooms/<slug>.ts` exports `room`, registered in `src/rooms/index.ts`.

A unit test fails until all three exist. Slugs are public: they are `#links`, video file names and the keys of the API's growth numbers.

## Add a video

Run `npm run video -- <your file> <slug>` (needs ffmpeg). It writes `public/videos/<slug>.mp4` as H.264 + AAC at 720p and at most 2 MB, which every browser plays and a phone loads quickly; a unit test fails on a bigger file, so don't copy a raw recording in. Optional captions go beside it as `public/videos/<slug>.vtt`. Commit both. The list of videos is made at build time; a project without one shows a small empty frame that says so. Keep it understandable with the sound off, and restart `npm run dev` after adding a file.

## Environment

See `.env.example`.

- `VITE_API_URL` — address of the small API (private `portfolio-api` repo, on Railway) behind lanterns, notes, weather, the "last seen working on" line and project growth. Empty = the page runs on its own: nothing is sent anywhere, lanterns stay in the browser, and "leave a note" says it didn't go through and gives the email. Production's value is set in `.github/workflows/pages.yml`.
- `VITE_LOCAL_API_PORT` — on `localhost`, when `VITE_API_URL` is set, the page talks to a local copy of the API on this port (default 8787) instead of the real one.

Tests never use the real API: unit tests mock `fetch`, and the smoke suite builds with no address and fails if any request leaves the machine.

## Good to know

- Links can point at a country or a place: `…/portfolio/#sea`, `…/portfolio/#emberquill`. The address follows the country you are in, and going inside a place adds a step that Back undoes. Links from the old site (`#voice-receptionist`, `#crm`, `#data-assistant`) land on the place that took them over (`src/nav/routing.ts`).
- `?weather=snow|rain` and `?grow=big|small` preview the weather and the growth range.
- The two typefaces (Gaegu, Spectral; Latin part only, SIL Open Font License) are served from `public/fonts/`. To change one, replace the `.woff2` files and `src/styles/fonts.css`.
- `public/og.jpg` is the picture shown when the link is pasted somewhere: the first screen at 1200×630, without the horizon bar. Retake it if the first screen changes.
- Deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`, after the checks pass.
