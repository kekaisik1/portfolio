/** Start-up: wires the parts together. Each part is its own module; this file only says in which order they wake. */
import './styles/index.css';
import { createAmbient } from './ambient/ambient';
import { initBoard } from './board/board';
import { initFooter } from './board/footer';
import { WORLDS } from './content/places';
import { byId, pickAll } from './lib/dom';
import { narrow, reduce, tall } from './lib/media';
import { worldOfHash } from './nav/routing';
import { initLanterns } from './night/lanterns';
import { loadToday } from './night/today';
import { initNote } from './note/form';
import { initRead } from './sheet/read';
import { initInput } from './travel/input';
import { createTravel } from './travel/travel';
import { initPlayer } from './video/player';
import { lookOf } from './worlds/looks';
import { createPhotos } from './worlds/photos';
import { fitWords } from './worlds/words';

const RESIZE_SETTLE_MS = 150;

function boot(): void {
  const root = document.documentElement;
  const lens = byId('lens');
  const cutLayer = byId('cut');
  const worlds = pickAll<HTMLElement>(byId('main'), '.world');
  let smooth = true;
  /** how many things cover the photo right now (the video, a sheet, the raised index): the canvas rests under them */
  let covers = 0;

  const photos = createPhotos(lens);
  const ambient = createAmbient(byId<HTMLCanvasElement>('fx'), {
    upright: () => tall.matches,
    reduced: () => reduce.matches,
    /* a device that cannot keep up loses the push-in too */
    onTooSlow: () => {
      smooth = false;
    },
  });
  const travel = createTravel({
    photos,
    lens,
    cutLayer,
    worlds,
    where: byId('where'),
    smooth: () => smooth,
  });
  const covered = (on: boolean): void => {
    covers = Math.max(0, covers + (on ? 1 : -1));
    ambient.pause(covers > 0);
  };

  const board = initBoard(travel, covered);
  const footer = initFooter(travel);
  const lanterns = initLanterns();
  const contact = WORLDS.findIndex((w) => w.kind === 'contact');

  /* leaving: the old world's detail stops at once, so nothing of it drifts over the cut */
  travel.onDepart((_to, from) => {
    if (from === null) return;
    ambient.set(null);
    lanterns.show(false);
  });
  travel.onArrive((i) => {
    ambient.set(lookOf(WORLDS[i].id));
    lanterns.show(i === contact);
  });

  initInput(travel, board.endIntro);
  initRead(covered);
  initPlayer(cutLayer, covered);
  initNote(lanterns.light, covered);

  const start = worldOfHash(location.hash);
  travel.start(start < 0 ? 0 : start);
  root.classList.add('live');

  let settle = 0;
  const relayout = (): void => {
    window.clearTimeout(settle);
    settle = window.setTimeout(() => {
      fitWords(worlds[travel.current()]);
      ambient.resize();
      lanterns.layout();
    }, RESIZE_SETTLE_MS);
  };
  window.addEventListener('resize', relayout);
  narrow.addEventListener('change', relayout);
  reduce.addEventListener('change', () => ambient.resize());
  /* the words are measured again once the typefaces are in: a name may wrap differently */
  void document.fonts.ready.then(() => fitWords(worlds[travel.current()]));

  void loadToday().then((today) => {
    if (today) footer.setToday(today.weather, today.now);
  });

  /* the first screen is standing: tests and frame checks wait for this */
  root.classList.add('ready');
}

boot();
