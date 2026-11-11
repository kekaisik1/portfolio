/** The video inside a place, in a pencil frame; or the small empty frame where one will go. */
import videos from 'virtual:videos';
import { MESSAGES } from '../content/site';
import type { Project } from '../content/types';
import { pick } from '../lib/dom';
import { mulberry32 } from '../lib/math';
import { dens, pencil } from '../world/draw/pencil';

const NOVID =
  '<svg viewBox="0 -12 78 62" aria-hidden="true" focusable="false"><path d="M3.4 4.2C20 3 54 4.6 74.6 3.4M75 3.6C74 16 75.6 34 74.4 46.6M74.6 46.2C52 47.4 22 45.6 3.2 46.8M3.6 46.6C4.6 32 2.6 16 3.8 3.8M9 9.4C28 8.6 50 9.8 69.4 9M69.6 9.2C69 20 70 32 69.2 41.2M69.4 41C50 41.8 28 40.4 9 41.4M9.2 41.2C10 30 8.6 20 9.4 9.2"/><path d="M18 3.6C26 -3 34 -8 39 -10.4C45 -7 52 -2 60 3.4" opacity=".6"/></svg>';

/** Address of a file in public/videos/, under whatever base the site is served from. */
export const videoUrl = (file: string, base: string = import.meta.env.BASE_URL): string => `${base}videos/${file}`;

/** Does this project have a video? (public/videos/<slug>.mp4, found at build time) */
export const hasVideo = (slug: string): boolean => Object.hasOwn(videos, slug);

/** Wobbly pencil path through a list of straight sides, as SVG path data. */
function pencilPath(sides: number[][], rnd: () => number, jit: number, passes: number): string {
  let d = '';
  for (const sd of sides) {
    for (const ps of pencil(dens(sd, 10), rnd, jit, passes)) {
      const a = ps.pts;
      d += 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1);
      for (let i = 2; i < a.length; i += 2) d += 'L' + a[i].toFixed(1) + ' ' + a[i + 1].toFixed(1);
    }
  }
  return d;
}

/** A pencil frame round the video, drawn to its current size. */
export function pencilFrame(fr: HTMLElement): void {
  const pf = pick<SVGSVGElement>(fr, '.pf'),
    path = pick<SVGPathElement>(pf, 'path'),
    w = fr.clientWidth,
    h = fr.clientHeight,
    m = 8,
    rnd = mulberry32(Math.round(w * 7 + h));
  const frame = pencilPath(
    [
      [0, 0, w, 0],
      [w, 0, w, h],
      [w, h, 0, h],
      [0, h, 0, 0],
    ],
    rnd,
    1.1,
    2,
  );
  /* it hangs on the wall: an outer moulding, a wire, a nail */
  const moulding = pencilPath(
    [
      [-7, -7, w + 7, -7],
      [w + 7, -7, w + 7, h + 7],
      [w + 7, h + 7, -7, h + 7],
      [-7, h + 7, -7, -7],
      [w * 0.2, -7, w / 2, -24],
      [w / 2, -24, w * 0.8, -7],
    ],
    rnd,
    0.9,
    1,
  );
  pf.setAttribute('viewBox', `${-m - 8} ${-m - 22} ${w + 2 * m + 16} ${h + 2 * m + 30}`);
  path.setAttribute('d', frame + moulding);
}

/** The small empty frame, with a few words beside it. */
export function noVideo(into: HTMLElement, msg: string): void {
  into.innerHTML = '<p class="novid">' + NOVID + '<span></span></p>';
  pick(into, 'span').textContent = msg;
}

/**
 * Put a project's video (or the empty frame, if it has none) into `into`.
 * `stillHere` says whether the visitor is still in that place when a late error arrives.
 */
export function showVideo(into: HTMLElement, p: Project, stillHere: () => boolean): void {
  if (!hasVideo(p.slug)) {
    noVideo(into, MESSAGES.noVideo);
    return;
  }
  const entry = videos[p.slug];
  into.innerHTML =
    '<div class="frame wait"><svg class="pf" aria-hidden="true" focusable="false"><path/></svg><div class="screen"><span class="vid-wait"></span></div></div>';
  const fr = pick(into, '.frame'),
    v = document.createElement('video');
  pick(fr, '.vid-wait').textContent = MESSAGES.videoLoading;
  v.controls = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.preload = 'metadata';
  v.setAttribute('aria-label', MESSAGES.videoLabel(p.name));
  /* with preload=metadata some browsers stop at loadedmetadata and fetch no frame until play is pressed:
     the controls must be uncovered by then, or the video looks stuck loading */
  const ready = (): void => fr.classList.remove('wait');
  v.addEventListener('loadedmetadata', ready, { once: true });
  v.addEventListener('loadeddata', ready, { once: true });
  v.addEventListener(
    'error',
    () => {
      if (stillHere()) noVideo(into, MESSAGES.videoFailed);
    },
    { once: true },
  );
  v.src = videoUrl(entry.src);
  if (entry.captions) {
    const t = document.createElement('track');
    t.kind = 'captions';
    t.src = videoUrl(entry.captions);
    t.srclang = 'en';
    t.label = 'Captions';
    t.default = true;
    v.append(t);
  }
  pick(fr, '.screen').prepend(v);
  pencilFrame(fr);
}
