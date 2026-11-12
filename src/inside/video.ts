/**
 * The video inside a place, in a mat on the paper; or the small empty frame where one will go.
 * States: loading ("loading…"), ready (the controls), no video ("no video yet"), failed ("the video didn't load").
 */
import videos from 'virtual:videos';
import { MESSAGES } from '../content/site';
import type { Project } from '../content/types';
import { pick } from '../lib/dom';

/** Address of a file in public/videos/, under whatever base the site is served from. */
export const videoUrl = (file: string, base: string = import.meta.env.BASE_URL): string => `${base}videos/${file}`;

/** Does this project have a video? (public/videos/<slug>.mp4, found at build time) */
export const hasVideo = (slug: string): boolean => Object.hasOwn(videos, slug);

/** The small empty frame, with a few words in it. */
export function noVideo(into: HTMLElement, msg: string): void {
  into.innerHTML =
    '<figure class="frame small" data-state="none"><div class="mat"><div class="vwrap"><p class="vstate"></p></div></div></figure>';
  pick(into, '.vstate').textContent = msg;
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
    '<figure class="frame" data-state="loading"><div class="mat"><div class="vwrap"><p class="vstate" aria-live="polite"></p></div></div></figure>';
  const fr = pick(into, '.frame'),
    v = document.createElement('video');
  pick(fr, '.vstate').textContent = MESSAGES.videoLoading;
  v.controls = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.preload = 'metadata';
  v.setAttribute('aria-label', MESSAGES.videoLabel(p.name));
  /* with preload=metadata some browsers stop at loadedmetadata and fetch no frame until play is pressed:
     the controls must be uncovered by then, or the video looks stuck loading */
  const ready = (): void => {
    fr.dataset.state = 'ready';
  };
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
  pick(fr, '.vwrap').prepend(v);
}
