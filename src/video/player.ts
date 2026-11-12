/**
 * The video: the photo area becomes the player, behind the same cut. A real modal dialog: the board stays in view
 * but cannot be reached, Tab stays between Close and the video, and Esc always closes (also from inside the video's
 * own controls). States: loading ("loading…"), ready (the controls), failed ("the video didn't load").
 */
import { MESSAGES } from '../content/site';
import { projectBySlug } from '../content/projects';
import { byId, nextFrame, pickAll } from '../lib/dom';
import { reduce } from '../lib/media';
import { runCut } from '../worlds/cut';
import type { VideoEntry } from '../../scripts/video-manifest';
import { videoOf, videoUrl } from './files';

function buildVideo(entry: VideoEntry, label: string): HTMLVideoElement {
  const v = document.createElement('video');
  v.controls = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.preload = 'metadata';
  v.setAttribute('aria-label', label);
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
  return v;
}

export function initPlayer(cutLayer: HTMLElement, onToggle: (open: boolean) => void): void {
  const dlg = byId<HTMLDialogElement>('player');
  const wrap = byId('pwrap');
  const state = byId('pstate');
  const title = byId('p-title');
  const closeBtn = byId<HTMLButtonElement>('pclose');
  let video: HTMLVideoElement | null = null;
  let opener: HTMLElement | null = null;
  let opening = false;

  function show(entry: VideoEntry, name: string): void {
    title.textContent = name;
    wrap.dataset.state = 'loading';
    state.textContent = MESSAGES.videoLoading;
    const v = buildVideo(entry, MESSAGES.videoLabel(name));
    video = v;
    /* with preload=metadata some browsers stop at loadedmetadata and fetch no frame until play is pressed:
       the controls must be uncovered by then, or the video looks stuck loading */
    const ready = (): void => {
      if (video !== v) return;
      if (v.videoWidth > 0 && v.videoHeight > 0) v.style.setProperty('--ar', String(v.videoWidth / v.videoHeight));
      wrap.dataset.state = 'ready';
      state.textContent = '';
    };
    v.addEventListener('loadedmetadata', ready, { once: true });
    v.addEventListener('loadeddata', ready, { once: true });
    v.addEventListener(
      'error',
      () => {
        if (video !== v) return;
        wrap.dataset.state = 'failed';
        state.textContent = MESSAGES.videoFailed;
      },
      { once: true },
    );
    wrap.prepend(v);
    dlg.showModal();
    closeBtn.focus({ preventScroll: true });
    onToggle(true);
    /* started by a press, so it may play with sound; a browser that still refuses leaves the controls to press */
    v.play().catch((err: unknown) => {
      if (!(err instanceof DOMException)) throw err;
    });
  }

  async function open(button: HTMLElement): Promise<void> {
    const slug = button.dataset.video ?? '';
    const project = projectBySlug(slug);
    const entry = videoOf(slug);
    if (opening || dlg.open || !project || !entry) return;
    opening = true;
    opener = button;
    if (!reduce.matches) {
      const cut = runCut(cutLayer, null);
      await cut.done;
      show(entry, project.name);
      await nextFrame();
      cut.remove();
    } else show(entry, project.name);
    opening = false;
  }

  dlg.addEventListener('close', () => {
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
      video = null;
    }
    onToggle(false);
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });
  closeBtn.addEventListener('click', () => dlg.close());
  /* a press on the frame around the video (not on the video or the top bar) leaves */
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target === wrap || e.target === state) dlg.close();
  });
  /* Esc: the dialog closes itself on its own cancel event, but a key pressed inside the video's native controls
     can be swallowed there, so it is also caught on the way down */
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Escape' || !dlg.open) return;
      e.preventDefault();
      dlg.close();
    },
    true,
  );
  /* Tab stays in the room: from the last thing in the player it goes round to Close, and back */
  dlg.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !video) return;
    const active = document.activeElement;
    if (e.shiftKey && active === closeBtn) {
      e.preventDefault();
      video.focus({ preventScroll: true });
    }
  });

  for (const b of pickAll<HTMLElement>(document, '[data-video]')) b.addEventListener('click', () => void open(b));
}
