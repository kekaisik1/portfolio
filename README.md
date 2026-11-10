# Portfolio

A pencil journey through mountains, sea and night sky. Each project is an object in the landscape; tap it to watch a short video.

Live: https://kekaisik1.github.io/portfolio/

- Add a project video: drop `videos/<slug>.mp4` (+ optional `.vtt`) in, see `videos/README.txt`, then commit and push. The deploy workflow rebuilds `videos/manifest.json` from whatever is in `videos/`.
- Plain static files, deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`.
- Links can point at a place or a project: `…/portfolio/#sea`, `…/portfolio/#emberquill` (any `id` in the page). The address follows the place you are in.
- `og.jpg` is the picture shown when the link is pasted into a chat or a post: the first screen at 1200×630, without the horizon bar. Retake it if the first screen changes.
- The lanterns, notes, weather, "last seen working on" line and project growth come from a small API in the private `portfolio-api` repo, hosted on Railway. Its address is the `portfolio-api` meta tag in `index.html`; empty it and the page runs on its own. On `localhost` the page looks for a local copy at `:8787` instead.
