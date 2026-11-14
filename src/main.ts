/** Start-up: wires the parts together. Each part is its own module; this file only says in which order they wake. */
import './styles/index.css';
import { createAmbient } from './ambient/ambient';
import { initBoard } from './board/board';
import { initFooter } from './board/footer';
import { WORLDS } from './content/places';
import { byId, pickAll } from './lib/dom';
import { narrow, reduce, tall } from './lib/media';
import { createTicker } from './lib/ticker';
import { createLiving } from './living/living';
import { worldOfHash } from './nav/routing';
import { initLanterns } from './night/lanterns';
import { loadToday } from './night/today';
import { initNote } from './note/form';
import { initOpening } from './opening/opening';
import { initRead } from './sheet/read';
import { createSound } from './sound/sound';
import { initSwitches } from './switches/switches';
import { initInput } from './travel/input';
import { initTry } from './try/panel';
import { createTravel } from './travel/travel';
import { initPlayer } from './video/player';
import { lookOf } from './worlds/looks';
import { createPhotos } from './worlds/photos';
import { createEffects } from './worlds/effects';
import { initReactions } from './worlds/react-view';
import { initToys } from './worlds/toy-view';
import { initSpots } from './worlds/spot-view';

const RESIZE_SETTLE_MS = 150;

function boot(): void {
  const root = document.documentElement;
  const lens = byId('lens');
  const cutLayer = byId('cut');
  const worlds = pickAll<HTMLElement>(byId('main'), '.world');
  /** false once the device has shown it cannot keep up: the motion stops and the photo no longer pushes in */
  let smooth = true;
  /** how many things cover the photo right now (the video, a sheet, the open board): the motion rests under them */
  let covers = 0;

  const photos = createPhotos(lens);
  const ticker = createTicker({
    onTooSlow: () => {
      smooth = false;
      living.enable(false);
    },
  });
  const upright = (): boolean => tall.matches;
  const living = createLiving(byId<HTMLCanvasElement>('live'), { photos, ticker, upright });
  const ambient = createAmbient(byId<HTMLCanvasElement>('fx'), { upright, ticker });
  const sound = createSound();
  const travel = createTravel({
    photos,
    lens,
    cutLayer,
    worlds,
    where: byId('where'),
    smooth: () => smooth && switches.motion(),
  });
  const spots = initSpots(worlds, lens, upright);
  const reactions = initReactions(worlds, lens, upright, {
    ambient,
    motion: () => smooth && switches.motion(),
    spotsShown: (i) => spots.shown(i),
  });
  const toys = initToys(worlds, lens, upright, {
    ambient,
    effects: createEffects(() => ({ width: lens.clientWidth, height: lens.clientHeight }), upright),
    motion: () => smooth && switches.motion(),
    random: Math.random,
  });
  /* the spots first: a reacting object never stands on one */
  const place = (i: number): void => {
    spots.layout(i);
    reactions.layout(i);
    toys.layout(i);
  };
  const relayout = (): void => {
    place(travel.current());
    living.resize();
    ambient.resize();
    lanterns.layout();
  };
  const switches = initSwitches({
    motion(on) {
      ticker.hold('switch', !on);
      living.enable(on);
      /* the photo's slow push-in holds where it is, and goes on from there */
      travel.holdPush(!on);
      /* the canvases were not laid out while they were hidden */
      if (on) relayout();
    },
    sound: (on) => sound.turn(on, WORLDS[travel.current()].id),
  });
  ticker.hold('switch', !switches.motion());
  living.enable(switches.motion());
  sound.arm(switches.sound(), () => WORLDS[travel.current()].id);

  const covered = (on: boolean): void => {
    covers = Math.max(0, covers + (on ? 1 : -1));
    ticker.hold('covered', covers > 0);
  };

  const board = initBoard(travel, covered);
  const footer = initFooter(travel);
  const lanterns = initLanterns();
  const contact = WORLDS.findIndex((w) => w.kind === 'contact');
  initOpening(travel);

  /* leaving: what is in the old world's air stops at once, so nothing of it drifts over the cut (the photo itself
     keeps moving under the slats until the new one lands) */
  travel.onDepart((to, from) => {
    sound.go(WORLDS[to].id);
    if (from === null) return;
    ambient.set(null);
    lanterns.show(false);
  });
  travel.onArrive((i) => {
    place(i);
    toys.arrive(i);
    living.show(i);
    ambient.set(lookOf(WORLDS[i].id));
    lanterns.show(i === contact);
  });

  initInput(travel, board.endIntro);
  initRead(covered);
  initPlayer(cutLayer, (open) => {
    covered(open);
    sound.duck(open);
  });
  initNote(lanterns.light, covered);
  initTry({ covered, motion: () => switches.motion() && !reduce.matches, cue: (voice) => sound.cue(voice) });

  const start = worldOfHash(location.hash);
  travel.start(start < 0 ? 0 : start);
  root.classList.add('live');

  let settle = 0;
  const settled = (): void => {
    window.clearTimeout(settle);
    settle = window.setTimeout(relayout, RESIZE_SETTLE_MS);
  };
  window.addEventListener('resize', settled);
  narrow.addEventListener('change', settled);

  /* the words are measured again once the typefaces are in: the spot must not stand on them */
  void document.fonts.ready.then(() => place(travel.current()));

  void loadToday().then((today) => {
    if (today) footer.setToday(today.weather, today.now);
  });

  /* the first screen is standing: tests and frame checks wait for this */
  root.classList.add('ready');
}

boot();
