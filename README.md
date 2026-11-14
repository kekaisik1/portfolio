# Portfolio

"Departures": a departures board where every destination is a place, and seven of the places are projects. It opens on the summit alone, filling the window: the name, "Hi, I'm Kaisar." low in the frame, one line, a hint, and two small switches in the corner. Every other place is built the same way: its painting fills the window, and low in the corner the painting leaves calm stand a kicker, the project's name, big, one line and its buttons; the longer text is one press away, behind "Read". The first step (wheel, arrow key, swipe, the hint, Tab) brings in a small caption in the top corner, `07/09  Kyoto  LIVE  ↑ ↓ to travel`: pressing it slides the board in from the left, a crisp mono index of ten rows (place, project, status) with the place's coordinates and clock at its foot. Choosing a row, turning the wheel, pressing an arrow key or swiping cuts to the next place like a board flipping: a few uneven slats close over the old picture in 300 ms and the new words are there. Summit (the greeting), Mountain pass, Observatory, Repair shop, Dragon's hall, Rome 117 AD, The open book, Kyoto, The road (about) and Campfire (write me, leave a note, light a lantern).

The places are paintings, and they move. Quietly: nothing in them is pushed by wind, so the painting never smears. Lights breathe and flicker (the booth on the pass, the dragon's gold, the lanterns of Kyoto, the campfire), stars twinkle, water runs and shimmers (the waterfall off the open book), and the air carries snow off the summit, sparks, petals and dust. And each has a sound, synthesised in the browser (wind, a cavern, drips after rain, a far phone, a bell), off until the sound switch is pressed. The other switch stops the motion (stills only). A project with a video plays it in the picture's frame from the Watch button in its words.

Every project's painting is a toy: things in it answer a press, without a label, and really change, each a piece of a second painting of the same scene fading in over its own place. On the pass the booth's door opens and the receiver hangs off the hook, a fox comes to the roadside, a car's headlights come round the far bend and the northern lights rise over the peaks; at the observatory the telescope's beam finds a constellation, the building lights up and a comet crosses the sky; at the repair shop the washing machine opens on its bubbles, the fridge on its shelves, the lamp lights the wall and parrots fly out of the palm; in Rome the brazier flames up, legionaries march through the arch, the temple's doors open on gold and doves rise over the Colosseum; in the open book the drawn page is painted in colour, fireworks burst over the castle, the pen's nib glows and a rainbow stands over the waterfall; in Kyoto the big lantern glows, the pagoda's windows light under a rising moon, a cat sits on the steps and petals fall from the blossom. In the dragon's hall the dragon breathes fire, the chest opens, the archer looses an arrow and the red die is thrown. In the three other places one object answers a press: snow blows off the summit, seeds off the grass, the campfire spits. On phones the words take the lower or upper third, and the board is a sheet raised from a bar at the bottom.

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
                      toys.ts (what a screen reader hears on each thing in a painting that answers a press),
                      site.ts (greeting, about, contact, messages) and render.ts (how it all becomes HTML)
src/worlds/           the paintings: looks.ts (where each world's words stand, its crop, what is in its air),
                      photos.ts (at most three mounted, each decoded before it is shown), cut.ts + slats.ts (the cut),
                      cover.ts (where a photo's pixels land on screen), picture.ts (where a point of a painting lands,
                      and what crowds what; pure), words.ts (showing a world's words),
                      toys.ts (each project's painting as a toy: what answers a press, which piece of its second
                      state fades in; pure), toy-view.ts (placing the toys, playing them), d20.ts (the thrown die),
                      reactions.ts (the one object in each of the other places that answers a press; pure),
                      react-view.ts (placing it), effects.ts (a soft light, an arrow),
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
public/               fonts, og.jpg, videos, worlds/ (the paintings), states/ (the pieces of their second states)
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
5. Make its painting a toy (see "Make a painting a toy").
6. Look at it at 1440x900, 1366x680, 390x844 and 320x568.

The unit tests fail until every project has a place, a look, a scene, a sound, both crops of its painting and its toys. Slugs are public: they are `#links`, picture and video file names and the keys of the API's growth numbers.

## Add a video

Run `npm run video -- <your file> <slug>` (needs ffmpeg). It writes `public/videos/<slug>.mp4` as H.264 + AAC at 720p and at most 2 MB, which every browser plays and a phone loads quickly; a unit test fails on a bigger file, so don't copy a raw recording in. Optional captions go beside it as `public/videos/<slug>.vtt`. Commit both. The list of videos and their running times is read at build time, so the project's "Watch 0:44" button appears by itself; a project without a video has no button. Keep it understandable with the sound off, and restart `npm run dev` after adding a file.

## Add a reaction

In the three places that are not projects (the summit, the road, the campfire) one object of the painting answers a press for a second or two: snow blows off the summit, seeds off the grass, the campfire flares and spits. A project's place is a toy instead (see "Make a painting a toy"). Unlabelled and quiet; nothing on hover, nothing follows the cursor, and with the motion switched off there is nothing to press. A reaction is data in `REACTIONS` in `src/worlds/reactions.ts`, built from two plain effects:

- `flare`: a soft round light at a point, `size` across in picture heights, in the place's own colour. An element animated with opacity and transform only.
- `burst`: a handful of particles from a point, drawn by the canvas of things in the air (`src/ambient/`): `rise` (sparks), `fall` (petals) or `drift` (snow or seeds on the wind, `dir` says which way). At most 30.

1. Read the object off a grid over the painting (as in "Make a place move"): its middle `u`, `v` and the size of the place to press, `w` and `h` in picture heights. Keep it the object, not half the picture; it is never under 44 px.
2. Pick one or two effects and put their points on the object (the top of a fire).
3. Give the place its `react` in `src/content/places.ts`: what a screen reader hears, a few words that say what pressing does ("Poke the fire").
4. Look at it at 1440x900, 1366x680, 390x844 and 320x568: a frame before the press and one a third of a second after. `src/worlds/react-view.ts` places it with the painting's cover maths (`src/worlds/picture.ts`), cuts it back to the screen, and leaves it out where the object is off the crop or it would stand on the words, the switches or the tag. The e2e suite checks this at those four sizes.

## Environment

See `.env.example`.

- `VITE_API_URL` — address of the small API (private `portfolio-api` repo, on Railway) behind lanterns, notes, and the weather and "last seen working on" lines in the board's footer. Empty = the page runs on its own: nothing is sent anywhere, lanterns stay in the browser, the footer shows only the place's coordinates and clock, and "leave a note" says it didn't go through and gives the email. Production's value is set in `.github/workflows/pages.yml`.
- `VITE_LOCAL_API_PORT` — on `localhost`, when `VITE_API_URL` is set, the page talks to a local copy of the API on this port (default 8787) instead of the real one.

Tests never use the real API: unit tests mock `fetch`, and the smoke suite builds with no address and fails if any request leaves the machine.

## Make a painting a toy

Every project's place is one (`src/worlds/toys.ts`). Several unlabelled things in the painting answer a press, each an invisible button the size of its object; most fade in a piece of a "second state", another painting of the same scene, laid exactly over its own place on the painting (`public/states/<world>/`): the booth's door opens, a fox comes to the roadside, the pagoda's windows light under a rising moon. Some stay until they are pressed again (`stays`), the rest fade out after a few seconds. A piece is cut so that only what really changed shows: fading a whole region between two paintings that differ a little everywhere makes the picture seem to tremble. A painting that is a toy holds still: it has no slow push-in. No labels and no panel; the Watch button in the words is its video's way in.

The dragon's hall goes furthest: the dragon breathes fire, the chest opens, the wizard's staff blazes, the archer looses an arrow, the gold throws sparks, and the red die is thrown: a real twenty-sided die with a number on every face (`src/worlds/d20.ts`, drawn on a small canvas) tumbles, lands on the thrown number and lies there showing it. It is painted with a patch of the painted die's own brushwork and redrawn twelve times a second, so it moves like something hand-made beside the painting, not like a smooth 3D render. What the number is decides what happens next, each with a painting of its own: on a 1 the dragon breathes fire over the party, under 10 the wizard's bolt goes wide and bursts on a pillar, on 10 and over it strikes the dragon, and on a 20 a blast throws the hoard into the air.

Keep it calm (Kaisar: "motion things feel like too much, making eyes hurt"): pieces fade in and out slowly (half a second or more), never flash, flicker or waver, and a press plays no spray of particles on top of a piece (Kyoto's blossom is only petals, a few of them).

1. Paint the second state: an edit of the same painting in which only the things that change are different (the prompts used are saved beside the sources in `../reference/painted-sources/states/`, as `<world>-<state>.png`). Compare it with the original before going on: everything else must be where it was. Some edits redraw a neighbour slightly (the repair shop's fridge came out narrower): cut around that.
2. Cut the pieces: add the world and its rectangles to `CUTS` in `../reference/painted-sources/states/make_states.py` and run `make_states.py public/states <world>`. It writes one WebP per piece into `public/states/<world>/`, whose alpha is the difference from the painting (`changed()`) times a feather at the rectangle's edges, and prints each rectangle in pixels. Look at each piece laid over the original: the whole change inside it, nothing unrelated, no box edge or doubled object.
3. Describe the toys in `src/worlds/toys.ts` (where to press, which piece fades in and for how long, what else plays, what sets what off; the rectangles copied from the script) and name each one in `src/content/toys.ts` with a plain verb ("Open the booth"). Where the thing appears only on a press (the fox, the comet), the place to press is where it will be.
4. Look at it: every toy pressed at 1440x900 and 390x844, and the words still readable while a piece passes behind them. Buttons that would stand on the words, the tag or the switches are left out; on phones most toys are cut off by the upright crop, and that is accepted.

## Good to know

- Links point at a place: `kekaisik.dev/#kana-notebook`, `#about`, `#contact`. The address follows the place you are in. Links from older versions (`#voice-receptionist`, `#crm`, `#data-assistant`, `#sea`…) land on the place that took them over (`src/nav/routing.ts`).
- Keys: arrows, Page Up/Down, `j`/`k`, Home and End travel; Esc closes the video, a sheet or the board.
- The opening shot is only the first impression: any `#link` (also `#hello`) starts with the tag already there, and coming back to the summit keeps it.
- The corner switches keep their state in `localStorage` (`kaisar.motion.v1`, `kaisar.sound.v1`: `on` / `off`). Motion starts off for visitors who ask for reduced motion; they can still turn it on.
- The two typefaces (Martian Mono for the board and labels, Schibsted Grotesk for names and running text; Latin part only, SIL Open Font License) are served from `public/fonts/`. To change one, replace the `.woff2` files and `src/styles/fonts.css` (the fallback faces there are scaled to the same widths, so re-measure them).
- `public/og.jpg` is the picture shown when the link is pasted somewhere: the summit with the greeting in Schibsted Grotesk, 1200×630. Remake it if the greeting or the summit painting changes: it is the painting at 1200 wide, cropped to 630 high, with the greeting and the `00 Summit` chip set over it in the site's own faces (render that as a 1200x630 page in a browser and save it as JPEG).
- Deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`, after the checks pass.
