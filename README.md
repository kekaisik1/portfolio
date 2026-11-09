# Portfolio

A pencil journey through mountains, sea and night sky. Each project is an object in the landscape; tap it to watch a short video.

Live: https://kekaisik1.github.io/portfolio/

- Add a project video: drop `videos/<slug>.mp4` (+ optional `.vtt`) in, see `videos/README.txt`, then commit and push. The deploy workflow rebuilds `videos/manifest.json` from whatever is in `videos/`.
- Plain static files, deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`.
