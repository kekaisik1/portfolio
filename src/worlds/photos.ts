/**
 * The photographs. At most three are mounted (the one on screen and its neighbours), each decoded before it is ever
 * shown: until then its tiny blurred stand-in is its background, so a cut never lands on a half-decoded picture.
 */
import { WORLDS } from '../content/places';
import { pickAll } from '../lib/dom';
import { TALL_QUERY } from '../lib/queries';
import { lookOf, photoUrl } from './looks';
import placeholders from './placeholders.json';

export interface Frame {
  i: number;
  el: HTMLElement;
  img: HTMLImageElement;
  /** settles when the picture is decoded (true) or could not be loaded (false) */
  ready: Promise<boolean>;
}

const standIns: Readonly<Record<string, { wide: string; tall: string }>> = placeholders;

/** Resolves true once the image is decoded and marked loaded, false when it cannot be had. */
function whenDecoded(el: HTMLElement, img: HTMLImageElement): Promise<boolean> {
  const ok = (): boolean => {
    el.classList.add('ld');
    return true;
  };
  return img.decode().then(ok, () => {
    /* decode() rejects for a broken picture, and also when the element was re-sourced or removed mid-decode */
    return img.complete && img.naturalWidth > 0 ? ok() : false;
  });
}

function build(i: number): Frame {
  const w = WORLDS[i];
  const look = lookOf(w.id);
  const el = document.createElement('div');
  el.className = 'frame';
  el.dataset.i = String(i);
  el.style.setProperty('--x', `${look.x}%`);
  const lq = standIns[w.id];
  if (lq) {
    el.style.setProperty('--lq', `url(${lq.wide})`);
    el.style.setProperty('--lq-m', `url(${lq.tall})`);
  }
  const picture = document.createElement('picture');
  const source = document.createElement('source');
  source.media = TALL_QUERY;
  source.srcset = photoUrl(w.id, true);
  const img = new Image();
  img.decoding = 'async';
  img.alt = w.alt;
  picture.append(source, img);
  el.append(picture);
  img.src = photoUrl(w.id, false);
  return { i, el, img, ready: whenDecoded(el, img) };
}

export interface Photos {
  /** Put a world's photo in the page (if it is not there) and start decoding it. */
  mount(i: number): Frame;
  /** Take out every photo but these. */
  prune(keep: readonly number[]): void;
  /** Bring one photo to the front. */
  show(i: number): void;
}

export function createPhotos(lens: HTMLElement): Photos {
  const frames = new Map<number, Frame>();

  /* the first world's photo is written into the page at build time, so it paints before this runs: take it over */
  for (const el of pickAll(lens, '.frame[data-i]')) {
    const i = Number(el.dataset.i);
    const img = el.querySelector('img');
    if (!img || !Number.isInteger(i) || frames.has(i)) {
      el.remove();
      continue;
    }
    frames.set(i, { i, el, img, ready: whenDecoded(el, img) });
  }

  return {
    mount(i) {
      let f = frames.get(i);
      if (!f) {
        f = build(i);
        frames.set(i, f);
        lens.prepend(f.el);
      }
      return f;
    },
    prune(keep) {
      for (const [i, f] of frames) {
        if (keep.includes(i)) continue;
        f.el.remove();
        frames.delete(i);
      }
    },
    show(i) {
      for (const [j, f] of frames) f.el.classList.toggle('on', j === i);
    },
  };
}
