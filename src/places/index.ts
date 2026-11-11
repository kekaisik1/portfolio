/** Every place, by project slug. Adding a project = adding its drawing here (and its room in ../rooms). */
import { place as bookforge } from './bookforge';
import { place as emberquill } from './emberquill';
import { place as frontDesk } from './front-desk';
import { place as historyLens } from './history-lens';
import { place as kanaNotebook } from './kana-notebook';
import { place as lowl } from './lowl';
import { place as numbersRoom } from './numbers-room';
import type { PlaceDef } from '../world/types';

export const PLACES: Readonly<Record<string, PlaceDef>> = {
  'front-desk': frontDesk,
  'numbers-room': numbersRoom,
  lowl,
  emberquill,
  'history-lens': historyLens,
  bookforge,
  'kana-notebook': kanaNotebook,
};
