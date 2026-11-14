/**
 * The "try it" panel: one small card over the painting, shared by every project. It only draws what the project's
 * machine says (src/try/run.ts); all behaviour is there. A real modal dialog: Esc, Close, a press outside or a swipe
 * down close it, focus goes back to the spot or button that opened it, and each press is told to screen readers
 * through a live line. The frame loop rests under it (`covered`).
 */
import { projectBySlug } from '../content/projects';
import { MESSAGES } from '../content/site';
import { tryOf } from '../content/tries';
import type { ProjectLink, TryCopy } from '../content/types';
import { byId, pick, pickAll } from '../lib/dom';
import { seeded } from '../lib/random';
import { closeOnOutsidePress, closeOnSwipeDown } from '../sheet/swipe';
import type { Voice } from '../sound/recipe';
import { PICK_UP } from './call';
import { startTry, type TryRun } from './run';
import { NEXT, type Block, type Choice, type TryView } from './view';

/** an example call: the ring before the first line, and the pause between lines */
const RING_MS = 1000;
const LINE_MS = 1300;
/** the d20's flicker before it lands: this many faces, this far apart */
const FLICKER_STEPS = 7;
const FLICKER_MS = 55;

export interface TryParts {
  /** the panel covers the painting (or stops covering it): the frame loop rests under it */
  covered(on: boolean): void;
  /** may things move: the motion switch is on and reduced motion is not asked for */
  motion(): boolean;
  /** one short sound, if the sound is on */
  cue(voice: Voice): void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function blockEl(b: Block): HTMLElement {
  switch (b.kind) {
    case 'text': {
      const p = el('p', `try-line${b.strong ? ' strong' : ''}${b.quiet ? ' quiet' : ''}`);
      if (b.tag) p.append(el('span', 'try-tag', b.tag), ' ');
      if (b.who) p.append(el('span', 'try-who', `${b.who}:`), ' ');
      p.append(b.text);
      return p;
    }
    case 'glyph': {
      const g = el('p', 'try-glyph', b.text);
      g.lang = 'ja';
      g.setAttribute('role', 'img');
      g.setAttribute('aria-label', b.label);
      return g;
    }
    case 'meter': {
      const m = el('div', 'try-meter');
      const bar = el('span', 'try-bar');
      bar.setAttribute('aria-hidden', 'true');
      const fill = el('span', 'try-fill');
      fill.style.transform = `scaleX(${b.max > 0 ? Math.max(0, Math.min(1, b.value / b.max)) : 0})`;
      bar.append(fill);
      m.append(bar, el('span', 'try-meter-t', b.text));
      return m;
    }
    case 'roll': {
      const r = el('p', 'try-roll', String(b.value));
      r.setAttribute('aria-hidden', 'true');
      return r;
    }
  }
}

function choiceEl(c: Choice): HTMLButtonElement {
  const b = el('button', 'btn try-choice');
  b.type = 'button';
  b.dataset.id = c.id;
  b.disabled = c.disabled === true;
  if (c.pressed !== undefined) b.setAttribute('aria-pressed', String(c.pressed));
  b.append(el('span', 'try-choice-l', c.label));
  if (c.mark) {
    b.dataset.mark = c.mark;
    b.append(el('span', 'try-mark', c.mark));
  }
  return b;
}

function linkEl(l: ProjectLink): HTMLAnchorElement {
  const a = el('a', 'btn go', l.label);
  a.href = l.href;
  if (l.external) {
    a.target = '_blank';
    a.rel = 'noopener';
    a.append(el('span', 'sr-only', MESSAGES.newTab));
  }
  return a;
}

export function initTry(parts: TryParts): void {
  const dlg = byId<HTMLDialogElement>('try');
  const title = byId('try-t');
  const step = byId('try-step');
  const blocks = byId('try-blocks');
  const choices = byId('try-choices');
  const after = byId('try-after');
  const end = byId('try-end');
  const said = byId('try-said');
  let run: TryRun | null = null;
  let copy: TryCopy | null = null;
  let opener: HTMLElement | null = null;
  let timer = 0;
  let rollN = 0;

  function stopTimer(): void {
    window.clearTimeout(timer);
    timer = 0;
  }

  /** Focus after a press: the same choice if it is still there, else the next thing to do, else the heading. */
  function refocus(pressed: string | null): void {
    const live = pickAll<HTMLButtonElement>(choices, 'button').filter((b) => !b.disabled);
    const same = live.find((b) => b.dataset.id === pressed);
    const next = same ?? live.at(0) ?? end.querySelector<HTMLElement>('a') ?? title;
    next.focus({ preventScroll: true });
  }

  function say(text: string): void {
    /* emptied first, so the same words twice are still read out */
    said.textContent = '';
    if (text) window.setTimeout(() => (said.textContent = text), 30);
  }

  /** a new d20 has landed: its face flickers through a few numbers first (not with the motion off) */
  function flicker(view: TryView, pressed: string | null): void {
    const face = blocks.querySelector<HTMLElement>('.try-roll');
    const later = pickAll<HTMLElement>(blocks, '.try-roll ~ *');
    if (!face || !parts.motion()) {
      say(view.said);
      refocus(pressed);
      return;
    }
    const value = face.textContent;
    for (const a of later) a.style.visibility = 'hidden';
    for (const b of pickAll<HTMLButtonElement>(choices, 'button')) b.disabled = true;
    const faces = seeded(rollN * 7919);
    let k = 0;
    const turn = (): void => {
      if (k++ < FLICKER_STEPS) {
        face.textContent = String(1 + Math.floor(faces() * 20));
        timer = window.setTimeout(turn, FLICKER_MS);
        return;
      }
      face.textContent = value;
      for (const a of later) a.style.visibility = '';
      for (const b of pickAll<HTMLButtonElement>(choices, 'button')) b.disabled = b.dataset.disabled === 'true';
      say(view.said);
      refocus(pressed);
    };
    turn();
  }

  function render(view: TryView, pressed: string | null): void {
    stopTimer();
    step.textContent = view.step;
    step.hidden = view.step === '';
    const before = blocks.childElementCount;
    const fresh = pressed !== null || view.auto === true;
    blocks.replaceChildren(...view.blocks.map(blockEl));
    after.replaceChildren(...view.after.map(blockEl));
    after.hidden = view.after.length === 0;
    /* lines that are new since the last press come in softly (a call, line by line; what a choice meant) */
    if (fresh) {
      for (const b of Array.from(blocks.children).slice(before)) b.classList.add('new');
      for (const b of Array.from(after.children)) b.classList.add('new');
    }
    choices.replaceChildren(
      ...view.choices.map((c) => {
        const b = choiceEl(c);
        b.dataset.disabled = String(b.disabled);
        return b;
      }),
    );
    choices.hidden = view.choices.length === 0;
    end.replaceChildren(...(view.link ? [linkEl(view.link)] : []));
    end.hidden = !view.link;
    dlg.dataset.done = String(view.done);

    const roll = view.blocks.find((b) => b.kind === 'roll');
    if (roll && roll.n !== rollN) {
      rollN = roll.n;
      flicker(view, pressed);
    } else {
      say(view.said);
      if (pressed !== null) refocus(pressed);
    }
    if (view.auto && run) {
      const current = run;
      timer = window.setTimeout(
        () => {
          if (run === current) render(current.press(NEXT), null);
        },
        blocks.querySelector('.try-who') ? LINE_MS : RING_MS,
      );
    }
  }

  function open(button: HTMLElement): void {
    const slug = button.dataset.try ?? '';
    const chosen = tryOf(slug);
    const project = projectBySlug(slug);
    if (dlg.open || !chosen || !project) return;
    opener = button;
    copy = chosen;
    dlg.dataset.kind = chosen.kind;
    run = startTry(chosen, seeded(Date.now() >>> 0));
    rollN = 0;
    title.textContent = `${project.name}: ${chosen.heading}`;
    blocks.replaceChildren();
    after.replaceChildren();
    render(run.view(), null);
    dlg.showModal();
    pick(dlg, '.sheet-body').scrollTop = 0;
    refocus(null);
    parts.covered(true);
  }

  choices.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest<HTMLButtonElement>('button[data-id]') : null;
    const id = b?.dataset.id;
    if (!b || b.disabled || !run || id === undefined) return;
    const view = run.press(id);
    /* the phone rings once as it is picked up, if the sound is on (inside the press: a gesture) */
    if (copy?.kind === 'call' && id === PICK_UP) parts.cue('ring');
    render(view, id);
  });

  dlg.addEventListener('close', () => {
    stopTimer();
    run = null;
    copy = null;
    said.textContent = '';
    parts.covered(false);
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });
  pick(dlg, '[data-close]').addEventListener('click', () => dlg.close());
  closeOnOutsidePress(dlg);
  closeOnSwipeDown(dlg, () => dlg.close());

  for (const b of pickAll<HTMLElement>(document, '[data-try]')) b.addEventListener('click', () => open(b));
}
