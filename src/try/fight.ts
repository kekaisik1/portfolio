/**
 * Emberquill's try: roll to hit an orc until it is down, with real 5e arithmetic. A d20 plus the attack bonus
 * against the enemy's armour class; a hit rolls the damage dice plus the bonus; a natural 20 always hits and rolls
 * the damage dice twice; a natural 1 always misses. The dice come from a random source handed in (seeded in
 * tests), so the machine is pure given it.
 */
import type { FightTry } from '../content/types';
import type { Block, TryMachine, TryView } from './view';

export interface Attack {
  d20: number;
  total: number;
  hit: boolean;
  crit: boolean;
  damage: number;
}

export interface FightState {
  hp: number;
  rolls: number;
  last: Attack | null;
}

export const ROLL = 'roll';

/** One die: 1..sides from a random number in [0, 1). */
export const die = (sides: number, rand: () => number): number => 1 + Math.min(sides - 1, Math.floor(rand() * sides));

/** One attack, by the rules. */
export function attack(copy: FightTry, rand: () => number): Attack {
  const d20 = die(20, rand);
  const total = d20 + copy.toHit;
  const crit = d20 === 20;
  const hit = crit || (d20 !== 1 && total >= copy.ac);
  if (!hit) return { d20, total, hit, crit, damage: 0 };
  const dice = copy.damage.count * (crit ? 2 : 1);
  let damage = copy.damage.bonus;
  for (let i = 0; i < dice; i++) damage += die(copy.damage.sides, rand);
  return { d20, total, hit, crit, damage };
}

export function fightMachine(copy: FightTry, rand: () => number): TryMachine<FightState> {
  /** what the last roll came to, in words: "14 + 5 = 19 vs AC 13: hit, 7 damage" */
  function line(a: Attack): string {
    const sum = copy.sum(a.d20, copy.toHit, a.total, copy.ac);
    if (a.crit) return `${sum}: ${copy.crit(a.damage)}`;
    if (a.d20 === 1) return `${sum}: ${copy.fumble}`;
    return `${sum}: ${a.hit ? copy.hit(a.damage) : copy.miss}`;
  }

  return {
    start: () => ({ hp: copy.hp, rolls: 0, last: null }),

    press(s, id) {
      if (id !== ROLL || s.hp <= 0) return s;
      const a = attack(copy, rand);
      return { hp: Math.max(0, s.hp - a.damage), rolls: s.rolls + 1, last: a };
    },

    view(s): TryView {
      const done = s.hp <= 0;
      const hp = copy.hpText(s.hp, copy.hp);
      const blocks: Block[] = [];
      let said = '';
      if (s.last) {
        blocks.push({ kind: 'roll', value: s.last.d20, n: s.rolls });
        blocks.push({ kind: 'text', text: line(s.last), strong: true });
        said = `${line(s.last)}. ${hp}.`;
      } else blocks.push({ kind: 'text', text: copy.intro });
      blocks.push({ kind: 'meter', value: s.hp, max: copy.hp, text: hp });
      if (done) {
        blocks.push({ kind: 'text', text: copy.down(s.rolls) });
        said = `${said} ${copy.down(s.rolls)}`;
      }
      return {
        step: '',
        blocks,
        choices: done ? [] : [{ id: ROLL, label: copy.roll }],
        after: [],
        said,
        done,
        ...(done && copy.link ? { link: copy.link } : {}),
      };
    },
  };
}
