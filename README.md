# Portfolio

"Departures": a departures board where every destination is a place, and seven of the places are projects. On the left a crisp mono index of ten rows (place, project, status); the rest of the screen is a photograph of the place you are in, with that project's words standing in the corner the photo leaves calm. Choosing a row, turning the wheel, pressing an arrow key or swiping cuts to the next place like a board flipping: a few uneven slats close over the old photo in 300 ms and the new words are there. Summit (the greeting), Front desk, Reading room, Workshop, Tavern, Soho 1854, Lighthouse, Kyoto, The road (about) and Campfire (write me, leave a note, light a lantern).

Each place has one quiet living detail (spindrift, a phone's glow, dust in lamp-light, embers, fog, a lighthouse beam, rain), and a project with a video plays it in the photo's frame. On phones the photo is the whole screen, the words take the lower or upper third, and the board is a sheet raised from a bar at the bottom.

Live: https://kekaisik1.github.io/portfolio/

## Run it

Node 22 or newer for the scripts (the site itself builds on 20).

```bash
npm install
npm run dev        # http://localhost:5173, no API: the page runs on its own
npm run check      # lint + typecheck + unit tests + build (what CI runs)
npm run test:e2e   # browser smoke suite against the real build (first time: npx playwright install chromium)
npm run build      # dist/, to be served from /portfolio/
npm run preview    # serves dist/ at http://localhost:4173/portfolio/
```

Other scripts: `lint`, `typecheck`, `test`, `format`, `worlds` (photographs), `video` (compress a video).

## How it is put together

Vite + TypeScript (strict), no UI framework: real HTML words over photographs, moved only with transforms and opacity, so plain modules are the right size.

```
index.html            the page shell: meta, the stage, the board, dialogs, {{slots}} the words are written into at build time
src/main.ts           start-up: wires the parts together
src/content/          every word on the page: projects.ts, places.ts (the board's rows: place, status, coordinates),
                      site.ts (greeting, about, contact, messages) and render.ts (how it all becomes HTML)
src/worlds/           the photographs: looks.ts (where each world's words stand, its crop, its living detail),
                      photos.ts (at most three mounted, each decoded before it is shown), cut.ts + slats.ts (the cut),
                      cover.ts (where a photo's pixels land on screen), words.ts (showing a world's words, folding
                      long text behind "Read"), placeholders.json (tiny blurred stand-ins, made by `npm run worlds`)
src/travel/           going from world to world: travel.ts (the sequence: board, decode, cut, words, focus),
                      input.ts (wheel, keys, swipe, #links), gesture.ts (one step per gesture; pure)
src/board/            the index rows and the phone's bar and sheet (board.ts), the footer with coordinates, a live
                      clock and the API's lines (footer.ts), the status-word flourish (scramble.ts)
src/ambient/          the one small canvas of living details; the page's only frame loop, off when nothing shows
src/video/            the player: the photo area becomes a modal video
src/sheet/            "Read": the longer text as a sheet over the photo; swipe-down and press-outside closing
src/note/             the note form by the campfire: validation, a small state machine, the form itself
src/night/            lanterns over the campfire, and the weather / "last seen working on" lines from the API
src/nav/              what an address means (#kana-notebook, old links) and keeping the address bar in step
src/api/              typed client for the optional API; every response is checked with Zod
src/lib/              DOM lookups that fail loudly, the layout media queries
src/styles/           CSS by concern; palette and type are custom properties in tokens.css; narrow.css is phones
                      and upright tablets; plain.css is the page without JavaScript and on paper
scripts/              build helpers: the video manifest (with running times), make-worlds.ts, compress-video.sh
public/               fonts, og.jpg, videos, worlds/ (the photographs)
tests/unit  tests/e2e
```

The words are written into `index.html` when the page is built (`vite.config.ts` → `src/content/render.ts`), so every project, its text and its link are in the page without JavaScript, for search engines and screen readers; without scripts the page reads as a plain stacked document with the board as a list of links. The first photograph is written in too, so the summit and the greeting paint before any script runs.

### Why it stays smooth

Only `transform` and `opacity` are animated. At most three photographs are in the page (the current one and its neighbours), and a photo is only shown once `img.decode()` has finished; a cut waits at most 400 ms for that and otherwise uses the photo's tiny blurred stand-in. The cut is a handful of compositor animations; the only frame loop is the ambient canvas (half resolution, about 30 fps), and it stops on a still world, in a hidden tab, under reduced motion and whenever something covers the photo. Nothing eases a scroll: one gesture is one step.

### The photographs

`npm run worlds -- <folder>` takes the ten source pictures (3:2, 1536x1024; the file-to-world table is at the top of `scripts/make-worlds.ts`) and writes, for each world, `public/worlds/<id>.webp`, an upright crop `<id>-m.webp` cut around the subject (`focus` in `src/worlds/looks.ts`) and two tiny blurred stand-ins into `src/worlds/placeholders.json`. It needs ffmpeg with libwebp. Commit what it writes; a unit test caps each file's size.

Where a world's words stand is chosen by looking at its photograph: `looks.ts` says which corner (`at`), how wide, which side of the photo survives a narrower window (`x`), and whether the words sit above or below the subject on a phone (`atTall`). The words must never land on the subject.

## Add a project

1. Add an entry to `src/content/projects.ts` (slug, group `work`/`play`, name, a line of at most 60 characters, the longer text, optional note and link).
2. Give it a place in `src/content/places.ts` (`PROJECT_PLACES`: the row's place name, status word, footer line, alt text).
3. Give it a look in `src/worlds/looks.ts` and a source picture in the table in `scripts/make-worlds.ts`, then run `npm run worlds -- <folder>`.
4. Look at it at 1440x900, 1366x680, 390x844 and 320x568.

The unit tests fail until every project has a place, a look and both photographs. Slugs are public: they are `#links`, photo and video file names and the keys of the API's growth numbers.

## Add a video

Run `npm run video -- <your file> <slug>` (needs ffmpeg). It writes `public/videos/<slug>.mp4` as H.264 + AAC at 720p and at most 2 MB, which every browser plays and a phone loads quickly; a unit test fails on a bigger file, so don't copy a raw recording in. Optional captions go beside it as `public/videos/<slug>.vtt`. Commit both. The list of videos and their running times is read at build time, so the project's "Watch 0:44" button appears by itself; a project without a video has no button. Keep it understandable with the sound off, and restart `npm run dev` after adding a file.

## Environment

See `.env.example`.

- `VITE_API_URL` — address of the small API (private `portfolio-api` repo, on Railway) behind lanterns, notes, and the weather and "last seen working on" lines in the board's footer. Empty = the page runs on its own: nothing is sent anywhere, lanterns stay in the browser, the footer shows only the place's coordinates and clock, and "leave a note" says it didn't go through and gives the email. Production's value is set in `.github/workflows/pages.yml`.
- `VITE_LOCAL_API_PORT` — on `localhost`, when `VITE_API_URL` is set, the page talks to a local copy of the API on this port (default 8787) instead of the real one.

Tests never use the real API: unit tests mock `fetch`, and the smoke suite builds with no address and fails if any request leaves the machine.

## Good to know

- Links point at a place: `…/portfolio/#kana-notebook`, `#about`, `#contact`. The address follows the place you are in. Links from older versions (`#voice-receptionist`, `#crm`, `#data-assistant`, `#sea`…) land on the place that took them over (`src/nav/routing.ts`).
- Keys: arrows, Page Up/Down, `j`/`k`, Home and End travel; Esc closes the video, a sheet or the phone's index.
- The two typefaces (Martian Mono for the board and labels, Schibsted Grotesk for names and running text; Latin part only, SIL Open Font License) are served from `public/fonts/`. To change one, replace the `.woff2` files and `src/styles/fonts.css` (the fallback faces there are scaled to the same widths, so re-measure them).
- `public/og.jpg` is the picture shown when the link is pasted somewhere: the summit with the greeting in Schibsted Grotesk, 1200×630. Remake it if the greeting or the summit photo changes.
- Deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`, after the checks pass.
