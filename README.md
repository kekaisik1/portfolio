# Portfolio

"Departures": a departures board where every destination is a place, and seven of the places are projects. It opens on the summit alone, filling the window: the name, "Hi, I'm Kaisar." low in the frame, one line, a hint, and two small switches in the corner. Every other place is built the same way: its painting fills the window, and low in the corner the painting leaves calm stand a kicker, the project's name, big, one line and its buttons; the longer text is one press away, behind "Read". The first step (wheel, arrow key, swipe, the hint, Tab) brings in a small caption in the top corner, `07/09  Kyoto  LIVE  ↑ ↓ to travel`: pressing it slides the board in from the left, a crisp mono index of ten rows (place, project, status) with the place's coordinates and clock at its foot. Choosing a row, turning the wheel, pressing an arrow key or swiping cuts to the next place like a board flipping: a few uneven slats close over the old picture in 300 ms and the new words are there. Summit (the greeting), Mountain pass, Observatory, Repair shop, Dragon's hall, Rome 117 AD, The open book, Kyoto, The road (about) and Campfire (write me, leave a note, light a lantern).

The places are paintings, and they move. Quietly: nothing in them is pushed by wind, so the painting never smears. Lights breathe and flicker (the booth on the pass, the dragon's gold, the lanterns of Kyoto, the campfire), stars twinkle, water runs and shimmers (the waterfall off the open book), and the air carries snow off the summit, sparks, petals and dust. And each has a sound, synthesised in the browser (wind, a cavern, drips after rain, a far phone, a bell), off until the sound switch is pressed. The other switch stops the motion (stills only). A project with a video plays it in the picture's frame, and every project has something to try inside its painting: a small breathing dot with a label on an object of the picture (the phone in the booth, the telescope, the washing machine, the red die, the terrace in Rome, the fountain pen, the shop sign in Kyoto) opens a small card with a taste of the project that takes a few seconds: read three kana cards, roll a d20 against an orc, listen in on an example call, ask the finance bot an example question, say what broke and get the repair shop's real page, make John Snow's choice at the parish Board (and see what is in the record), or find the line an editor would stop at. Kyoto's big lantern and the wizard's staff in the dragon's hall are spots too: they play the Kana Notebook video and a recording of a fight on the real Emberquill table. And in every place one object answers a press without a word: the booth's light flickers, a shooting star crosses the sky over the observatory, the brazier flares, the gold throws sparks, the campfire spits. On phones the words take the lower or upper third, and the board is a sheet raised from a bar at the bottom.

Live: https://kekaisik.dev/

## Run it

Node 22 or newer for the scripts (the site itself builds on 20).

```bash
npm install
npm run dev        # http://localhost:5173, no API: the page runs on its own
npm run check      # lint + typecheck + unit tests + build (what CI runs)
npm run test:e2e   # browser smoke suite against the real build, and the sound check (first time: npx playwright install chromium)
npm run build      # dist/, served from the root of kekaisik.dev
npm run preview    # serves dist/ at http://localhost:4173/
```

Other scripts: `lint`, `typecheck`, `test`, `format`, `worlds` (the paintings), `video` (compress a video).

## How it is put together

Vite + TypeScript (strict), no UI framework: real HTML words over paintings, moved only with transforms and opacity, so plain modules are the right size.

```
index.html            the page shell: meta, the stage, the name and the tag, the board, dialogs, {{slots}} the words are
                      written into at build time
src/main.ts           start-up: wires the parts together
src/content/          every word on the page: projects.ts, places.ts (the board's rows: place, status, coordinates),
                      tries.ts (each project's "try it": its words and data),
                      site.ts (greeting, about, contact, messages) and render.ts (how it all becomes HTML)
src/worlds/           the paintings: looks.ts (where each world's words stand, its crop, what is in its air),
                      photos.ts (at most three mounted, each decoded before it is shown), cut.ts + slats.ts (the cut),
                      cover.ts (where a photo's pixels land on screen), words.ts (showing a world's words),
                      spots.ts (the things to open inside a painting: where they stand; pure), spot-view.ts
                      (putting them on their objects), reactions.ts (the one object in each painting that answers
                      a press: where, and with which effects; pure), react-view.ts (placing it, playing them),
                      placeholders.json (tiny blurred stand-ins, made by `npm run worlds`)
src/living/           the living picture: scenes.ts (what moves in each painting: the data you author), scene.ts (its
                      shape), raster.ts (regions -> two small mask textures; pure), noise.ts (a seamless noise tile;
                      pure), shader.ts (the GLSL), living.ts (the WebGL canvas: textures, uniforms, one draw call a frame)
src/ambient/          the small things in a world's air, on a 2D canvas: snow off the ridge, sparks, petals, dust
src/sound/            each place's ambience, synthesised: recipe.ts (the recipes and their timing maths; pure),
                      samples.ts (noise and crackle loops, measuring; pure), engine.ts (builds a recipe on any audio
                      context), sound.ts (the page's sound: gesture, crossfade, duck, suspend), render.ts (offline
                      rendering, for the checks)
src/switches/         the two corner switches (motion, sound) and what they remember (prefs.ts; pure)
src/opening/          the opening shot: the summit without even the tag until the first step
src/travel/           going from world to world: travel.ts (the sequence: board, decode, cut, words, focus),
                      input.ts (wheel, keys, swipe, #links), gesture.ts (one step per gesture; pure)
src/board/            the index rows, the drawer and the tag that opens it (on phones: the bar and the sheet) (board.ts),
                      the footer with coordinates, a live
                      clock and the API's lines (footer.ts), the status-word flourish (scramble.ts)
src/video/            the player: the picture area becomes a modal video
src/try/              "try it": one small state machine per kind of try (kana.ts, fight.ts, call.ts, pick.ts; pure),
                      what a panel shows (view.ts), one play of a try (run.ts), and the card that draws it (panel.ts)
src/sheet/            "Read": the longer text as a sheet over the picture (every layout); swipe-down and press-outside closing
src/note/             the note form by the campfire: validation, a small state machine, the form itself
src/night/            lanterns over the campfire, and the weather / "last seen working on" lines from the API
src/nav/              what an address means (#kana-notebook, old links) and keeping the address bar in step
src/api/              typed client for the optional API; every response is checked with Zod
src/lib/              DOM lookups that fail loudly, the layout media queries, the page's one frame loop (ticker.ts),
                      a seeded random source
src/styles/           CSS by concern; palette and type are custom properties in tokens.css; narrow.css is phones
                      and upright tablets; plain.css is the page without JavaScript and on paper
scripts/              build helpers: the video manifest (with running times), make-worlds.ts, compress-video.sh
public/               fonts, og.jpg, videos, worlds/ (the paintings)
tests/unit  tests/e2e  tests/pages (a page only the dev server serves: the sound check)
```

The words are written into `index.html` when the page is built (`vite.config.ts` → `src/content/render.ts`), so every project, its text and its link are in the page without JavaScript, for search engines and screen readers; without scripts the page reads as a plain stacked document with the board as a list of links. The first painting is written in too, so the summit and the greeting paint before any script runs.

### Why it stays smooth

In CSS only `transform` and `opacity` are animated. At most three paintings are in the page (the current one and its neighbours), and a painting is only shown once `img.decode()` has finished; a cut waits at most 400 ms for that and otherwise uses its tiny blurred stand-in. The cut is a handful of compositor animations. Nothing eases a scroll: one gesture is one step.

The motion is the GPU's work. The living picture is one WebGL 2 canvas over the paintings: a single triangle whose shader samples the picture and moves its pixels, so a frame costs the main thread a few uniforms and one draw call (measured on a laptop with a discrete GPU: about 0.4 ms of main thread a frame, and every frame on time at 1440x900 and at 390x844). The canvas has at most 1.3 million pixels and 1.5 per CSS pixel, and is transparent wherever nothing moves, so the sharp `<img>` shows through and the two can never disagree. There is one frame loop for the whole page (`src/lib/ticker.ts`); it stops in a hidden tab, while the video, a sheet or the open board covers the picture, and when the motion switch is off, and a device that keeps dropping frames loses the motion instead of stuttering. Without WebGL 2 the paintings simply stay still.

Still forbidden: layered parallax, anything that follows the cursor, animated CSS filters or blend modes, scroll smoothing.

### How a painting moves

Three things can happen inside a painting, each inside soft-edged regions drawn over it (`src/living/scenes.ts`):

- **flow**: pixels are carried along a direction, as two copies of the picture that fade into each other half a cycle apart, so the loop has no seam. Running water only (the waterfall): cloud, grass or fog carried this way reads as the painting being dragged, so wind moves nothing;
- **shimmer**: a small restless ripple (water, and its reflections on wet stone);
- **lights and stars**: the painting's own light gets brighter and darker (a brazier, a booth, a wizard's staff), and pixels brighter than their surroundings twinkle (stars, the dragon's gold).

A painting where none of these happen is fine (the summit, the repair shop, the road): its canvas is not drawn at all, and only its air moves.

On top of that the 2D canvas of `src/ambient/` draws what is in the air: snow blown off the summit, sparks, blossom petals, dust.

A world starts from the exact still and comes alive over a second and a half, so a cut never jumps: the slats carry the still picture, and the old world keeps moving under them until the new one lands.

### Make a place move

1. Put a 10x10 grid over the source painting (`ffmpeg -i painting.png -vf "drawgrid=w=iw/10:h=ih/10:c=white@0.35" grid.jpg`) and read coordinates off it: `u` across and `v` down, 0..1, always in the **landscape** picture (the upright crop on phones is mapped for you). Lengths (`feather`, radii) are in picture heights.
2. In `src/living/scenes.ts` describe the regions: a polygon or an ellipse, a `feather` (the edge fades inwards, so a region never leaks past its shape), optional `minus` shapes for solid things inside it (a rock in the water), an optional `ramp` (water slows where it spreads out). Give a flow its `dir`, a shimmer or star field its `amount`, a light its place, radius, `amount`, `speed` and `kind`. A polygon that reaches the picture's edge should run past it (-0.1 or 1.1), or its feather will fade at the edge.
3. Stop every region short of anything solid: a moving edge on a still thing (a ridge, a wall, a tree trunk) reads as a wobble. Keep moves small; the unit tests cap them. If a move looks fake, make it smaller or take it out.
4. Things in the air (snow, sparks, petals, dust) are the world's `ambient` in `src/worlds/looks.ts`. Wind belongs there, never in the painting's pixels.
5. Look at it: two screenshots two seconds apart, and their difference, show what moves and that nothing else does. Emulate reduced motion with `localStorage['kaisar.motion.v1'] = 'on'` for this, so the slow push-in is off and only the scene moves.

### Sound

Off by default; the sound switch turns it on, and the choice is kept in this browser, though an audio context is only ever created inside a press or a key. Nothing is downloaded: every ambience is built from looping noise through filters, a few oscillators and small one-off voices (`src/sound/recipe.ts` says what, `engine.ts` builds it). Moving to another place crossfades in 0.4 s, a video ducks it to silence, a hidden tab suspends it, and the master gain is low: it is ambience.

Nobody can listen from a test, so `tests/e2e/sound.spec.ts` renders each place's ambience with an offline audio context (through a page only the dev server serves, `tests/pages/sound-check.html`) and checks it is there, quiet, unclipped and centred on zero. That says nothing about whether it sounds good: tune the recipes by ear.

### The paintings

The pictures are paintings: one gouache/watercolour film-background look for all ten, a place per project rather than a piece of one. The sources are not in this repo: they are 1536x1024 PNGs in `../reference/painted-sources/`, made by `gen.sh` there (one prompt per place, generated with Codex's image tool). To change a place, change its prompt there, make the picture again, and run the script below.

`npm run worlds -- <folder>` takes the ten source pictures (3:2, 1536x1024; the file-to-world table is at the top of `scripts/make-worlds.ts`: copy each source into the folder under the name that table expects) and writes, for each world, `public/worlds/<id>.webp`, an upright crop `<id>-m.webp` cut around the subject (`focus` in `src/worlds/looks.ts`) and two tiny blurred stand-ins into `src/worlds/placeholders.json`. It needs ffmpeg with libwebp. Commit what it writes; a unit test caps each file's size.

Where a world's words stand is chosen by looking at its painting: `looks.ts` says which corner (`at`: low left by default, like the summit; top left only where the lower left holds the subject), how wide, how dark the shade behind them is (`shade`), which side of the picture survives a narrower window (`x`), and whether the words sit above or below the subject on a phone (`atTall`). The words must never land on the subject. The shade is a halo around the letters and a soft ellipse that is gone before its own edge, never a box: set `shade` as light as keeps every line at WCAG AA against what is behind it (measure the letters on a screenshot, not the whole box).

## Add a project

1. Add an entry to `src/content/projects.ts` (slug, group `work`/`play`, name, a line of at most 60 characters, the longer text, optional note and link).
2. Give it a place in `src/content/places.ts` (`PROJECT_PLACES`: the row's place name, status word, footer line, alt text).
3. Give it a look in `src/worlds/looks.ts` and a source picture in the table in `scripts/make-worlds.ts`, then run `npm run worlds -- <folder>`.
4. Say what moves in its painting (`src/living/scenes.ts`, see "Make a place move") and what it sounds like (`src/sound/recipe.ts`).
5. Look at it at 1440x900, 1366x680, 390x844 and 320x568.

The unit tests fail until every project has a place, a look, a scene, a sound and both crops of its painting. Slugs are public: they are `#links`, picture and video file names and the keys of the API's growth numbers.

## Add a video

Run `npm run video -- <your file> <slug>` (needs ffmpeg). It writes `public/videos/<slug>.mp4` as H.264 + AAC at 720p and at most 2 MB, which every browser plays and a phone loads quickly; a unit test fails on a bigger file, so don't copy a raw recording in. Optional captions go beside it as `public/videos/<slug>.vtt`. Commit both. The list of videos and their running times is read at build time, so the project's "Watch 0:44" button appears by itself; a project without a video has no button. Keep it understandable with the sound off, and restart `npm run dev` after adding a file.

## Add a spot

A spot is one thing to open inside a painting: a dot on an object of the picture, a slow breathing ring around it and a small label beside it, all one real button. Pressing it (or Enter) opens the project's video (`opens: 'video'`) or its try (`opens: 'try'`, see "Add a try-it"). A world has at most two, one of each, so the painting stays calm.

1. A video spot needs the video first (see "Add a video"); a try spot needs the try.
2. Put a 10x10 grid over the source painting (as in "Make a place move") and read where the object is: `u` across and `v` down, 0..1, in the **landscape** painting.
3. Add it to the world's list in `SPOTS` in `src/worlds/spots.ts`: `u`, `v`, which `side` of the dot the label stands (where it covers the least of the object) and what it `opens`. Where two would crowd each other, the first in the list stays.
4. Give it its label: a video spot's is the project's `spot` in `src/content/projects.ts` ("watch the app"; the running time is added), a try spot's is the try's `spot` in `src/content/tries.ts` ("read a card"). A few words, lower case.
5. Look at it at 1440x900, 1366x680, 390x844 and 320x568. The page places the spots with the same cover maths as the painting (`src/worlds/cover.ts`), for the landscape picture and the upright crop, again on every resize, and the layer pushes in with the painting. Where the object is cut off, or a spot would stand on the words, the corner switches, the tag or the other spot, it is not shown and the button in the words that opens the same thing (Watch, Try it) stays; where it is shown, that button goes (one way in). The e2e suite checks this at those four sizes.

## Add a try-it

A try is a taste of a project that takes five to fifteen seconds: pick something, then see what it meant. Kaisar's rules for them: plain choices, nothing to drag, nothing to learn first, plain first-person words, and a private project's try is clearly an example (no client names, real numbers or currencies).

1. Pick a kind (`src/try/`): `kana` (cards with readings to pick), `fight` (roll a d20 against an enemy, real 5e arithmetic, dice from a seeded random source), `call` (lines that appear one after another once you pick up) or `pick` (choices that show what they meant: `once` for one decision, `find` for the one line that is wrong, `any` for answers to every question). A new kind is a new pure machine beside them (a `start`, a `press` and a `view`, see `view.ts`) with its unit tests, and a case in `run.ts`; the panel draws any view, so it does not change.
2. Write its words and data in `TRIES` in `src/content/tries.ts`: the spot's label, the heading, and what the kind needs. A link to a live site's page only once you have opened that page.
3. Give it a spot in its painting (`opens: 'try'`, see "Add a spot"). Where the spot cannot be shown, the project's Try it button opens it instead.
4. Play it through at 1440x900 and 320x568: it should fit the card without scrolling on a laptop, and every line should say what it means in words (right, wrong, your choice), never by colour alone. The unit tests play every try to its end; the e2e suite opens each from its painting, finishes it, and closes it with Esc.

The card (`src/try/panel.ts`, `styles/try.css`) is a modal dialog like the Read sheet: Esc, Close, a press outside or a swipe down close it, focus goes back to whatever opened it, each press is told to screen readers through a live line, and the frame loop rests under it. The d20 flickers through a few faces before it lands, except with the motion switched off; the example call's phone rings once as it is picked up, only if the sound is already on.

## Add a reaction

In every place one object of the painting answers a press for a second or two: the booth's light flickers, a shooting star crosses the observatory's sky, the brazier flares, the dragon's gold throws sparks. Unlabelled and quiet; nothing on hover, nothing follows the cursor, and with the motion switched off there is nothing to press. A reaction is data in `REACTIONS` in `src/worlds/reactions.ts`, built from three plain effects:

- `flare`: a soft round light at a point, `size` across in picture heights, in the place's own colour; `flicker` makes it stutter like a failing bulb instead of swelling once. An element animated with opacity and transform only.
- `burst`: a handful of particles from a point, drawn by the canvas of things in the air (`src/ambient/`): `rise` (sparks), `fall` (petals), `drift` (snow or seeds on the wind, `dir` says which way) or `sparkle` (spray). At most 30.
- `streak`: one shooting star `from` a point `to` a point.

1. Read the object off a grid over the painting (as in "Make a place move"): its middle `u`, `v` and the size of the place to press, `w` and `h` in picture heights. Keep it the object, not half the picture; it is never under 44 px. Keep it off the spots.
2. Pick one or two effects and put their points on the object (the light of a lamp, the top of a fire).
3. Give the place its `react` in `src/content/places.ts`: what a screen reader hears, a few words that say what pressing does ("Stoke the brazier").
4. Look at it at 1440x900, 1366x680, 390x844 and 320x568: a frame before the press and one a third of a second after. `src/worlds/react-view.ts` places it with the same cover maths as the spots, cuts it back to the screen, and leaves it out where the object is off the crop or it would stand on the words, a spot, the switches or the tag (on phones the upright crop leaves several objects out). The e2e suite checks this at those four sizes.

## Environment

See `.env.example`.

- `VITE_API_URL` — address of the small API (private `portfolio-api` repo, on Railway) behind lanterns, notes, and the weather and "last seen working on" lines in the board's footer. Empty = the page runs on its own: nothing is sent anywhere, lanterns stay in the browser, the footer shows only the place's coordinates and clock, and "leave a note" says it didn't go through and gives the email. Production's value is set in `.github/workflows/pages.yml`.
- `VITE_LOCAL_API_PORT` — on `localhost`, when `VITE_API_URL` is set, the page talks to a local copy of the API on this port (default 8787) instead of the real one.

Tests never use the real API: unit tests mock `fetch`, and the smoke suite builds with no address and fails if any request leaves the machine.

## Make a painting a toy

The dragon's hall is one: press the dragon and it breathes fire, the chest opens, the wizard's staff blazes, the archer looses an arrow, the gold throws sparks, and the red die is thrown: a real twenty-sided die with a number on every face (`src/worlds/d20.ts`, drawn on a small canvas) tumbles, lands on the thrown number and lies there showing it. What the number is decides what happens next, each with a painting of its own: on a 1 the dragon only snorts smoke, under 10 the wizard's bolt goes wide and bursts on a pillar, on 10 and over it strikes the dragon, and on a 20 a blast throws the hoard into the air. A painting that is a toy holds still: it has no slow push-in. No labels and no panel.

1. Paint the second state: an edit of the same painting in which only the things that change are different (the prompts used are saved beside the sources in `../reference/painted-sources/states/`). Compare it with the original before going on: everything else must be where it was.
2. Cut the pieces: add the rectangles to `../reference/painted-sources/states/make_states.py` and run it with `public/states/<world>` as its argument. It writes one feathered WebP per piece and prints each rectangle.
3. Describe the toys in `src/worlds/toys.ts` (where to press, which piece fades in and for how long, which plain effects play, what sets what off) and name each one in `src/content/toys.ts`.
4. Look at it: every toy pressed at 1440x900 and 390x844, and the words still readable while a piece passes behind them.

## Good to know

- Links point at a place: `kekaisik.dev/#kana-notebook`, `#about`, `#contact`. The address follows the place you are in. Links from older versions (`#voice-receptionist`, `#crm`, `#data-assistant`, `#sea`…) land on the place that took them over (`src/nav/routing.ts`).
- Keys: arrows, Page Up/Down, `j`/`k`, Home and End travel; Esc closes the video, a sheet or the board.
- The opening shot is only the first impression: any `#link` (also `#hello`) starts with the tag already there, and coming back to the summit keeps it.
- The corner switches keep their state in `localStorage` (`kaisar.motion.v1`, `kaisar.sound.v1`: `on` / `off`). Motion starts off for visitors who ask for reduced motion; they can still turn it on.
- The two typefaces (Martian Mono for the board and labels, Schibsted Grotesk for names and running text; Latin part only, SIL Open Font License) are served from `public/fonts/`. To change one, replace the `.woff2` files and `src/styles/fonts.css` (the fallback faces there are scaled to the same widths, so re-measure them).
- `public/og.jpg` is the picture shown when the link is pasted somewhere: the summit with the greeting in Schibsted Grotesk, 1200×630. Remake it if the greeting or the summit painting changes: it is the painting at 1200 wide, cropped to 630 high, with the greeting and the `00 Summit` chip set over it in the site's own faces (render that as a 1200x630 page in a browser and save it as JPEG).
- Deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`, after the checks pass.
