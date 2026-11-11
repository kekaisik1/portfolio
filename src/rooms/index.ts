/** Every room, by project slug. Adding a project = adding its room here (and its drawing in ../places). */
import { room as bookforge } from './bookforge';
import { room as emberquill } from './emberquill';
import { room as frontDesk } from './front-desk';
import { room as historyLens } from './history-lens';
import { room as kanaNotebook } from './kana-notebook';
import { room as lowl } from './lowl';
import { room as numbersRoom } from './numbers-room';
import type { RoomDef } from '../world/types';

export const ROOMS: Readonly<Record<string, RoomDef>> = {
  'front-desk': frontDesk,
  'numbers-room': numbersRoom,
  lowl,
  emberquill,
  'history-lens': historyLens,
  bookforge,
  'kana-notebook': kanaNotebook,
};
