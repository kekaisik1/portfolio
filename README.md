# Portfolio

A pencil journey through mountains, sea and night sky. Each project is an object in the landscape; tap it to watch a short video.

Live: https://kekaisik1.github.io/portfolio/

- Add a project video: drop `videos/<slug>.mp4` (+ optional `.vtt`) in, see `videos/README.txt`, then commit and push. The deploy workflow rebuilds `videos/manifest.json` from whatever is in `videos/`.
- Plain static files, deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`.
- Links can point at a place or a project: `…/portfolio/#sea`, `…/portfolio/#emberquill` (any `id` in the page). The address follows the place you are in.
- `og.jpg` is the picture shown when the link is pasted into a chat or a post: the first screen at 1200×630, without the horizon bar. Retake it if the first screen changes.
- `server/` is a small optional API (shared lanterns, notes to Telegram, Astana's weather, the "last seen working on" line). The page runs without it; see `server/README.md` to run or deploy it, then put its address in the `portfolio-api` meta tag in `index.html`.
