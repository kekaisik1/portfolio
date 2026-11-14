import { describe, expect, it } from 'vitest';
import { PROJECTS } from '../../src/content/projects';
import { TRIES, tryOf } from '../../src/content/tries';
import type { CallTry, FightTry, KanaTry, PickTry, TryCopy } from '../../src/content/types';
import { seeded } from '../../src/lib/random';
import { callMachine, PICK_UP } from '../../src/try/call';
import { attack, die, fightMachine, ROLL } from '../../src/try/fight';
import { kanaMachine, NEXT_CARD } from '../../src/try/kana';
import { pickMachine } from '../../src/try/pick';
import { startTry } from '../../src/try/run';
import { NEXT, type TryView } from '../../src/try/view';

function copyOf<K extends TryCopy['kind']>(slug: string, kind: K): Extract<TryCopy, { kind: K }> {
  const t = tryOf(slug);
  if (!t || t.kind !== kind) throw new Error(`${slug} has no ${kind} try`);
  return t as Extract<TryCopy, { kind: K }>;
}

/** every word a view puts on screen */
const words = (v: TryView): string =>
  [
    v.step,
    ...[...v.blocks, ...v.after].map((b) => (b.kind === 'text' ? `${b.tag ?? ''} ${b.who ?? ''} ${b.text}` : '')),
    ...v.choices.map((c) => `${c.label} ${c.mark ?? ''}`),
    v.link?.label ?? '',
  ].join(' ');

/** a random source that gives these numbers in turn */
const queue =
  (...xs: number[]): (() => number) =>
  () =>
    xs.shift() ?? 0;
/** the random number that rolls face `n` of a die with `sides` sides */
const face = (n: number, sides: number): number => (n - 0.5) / sides;

describe('the tries: their words', () => {
  it('gives every project a try with a spot label and a heading', () => {
    for (const p of PROJECTS) {
      const t = tryOf(p.slug);
      expect(t, p.slug).not.toBeNull();
      expect(t?.spot, p.slug).toMatch(/^[a-z][a-z ?]{2,20}$/);
      expect(t?.heading.trim(), p.slug).not.toBe('');
    }
    expect(Object.keys(TRIES).sort()).toEqual(PROJECTS.map((p) => p.slug).sort());
    expect(tryOf('hello')).toBeNull();
  });

  it('marks the two private projects as examples, with no currency, client or phone number in them', () => {
    const call = copyOf('front-desk', 'call');
    const money = copyOf('numbers-room', 'pick');
    const all = JSON.stringify([call, money]);

    expect(call.mark).toMatch(/example call/);
    expect(money.step).toMatch(/made-up numbers/);
    expect(money.end?.text).toMatch(/made up/);
    expect(all).not.toMatch(/[$€£¥₸₽]|\b(USD|EUR|KZT|RUB|dollars?|tenge|roubles?)\b/i);
    expect(all).not.toMatch(/\d{3}[ -.]?\d{3}[ -.]?\d{4}|\+\d/);
    expect(all).not.toMatch(/LOWL|Kabi|Sui|Foundation/i);
  });

  it('links LOWL only to its own pages, in a new tab', () => {
    const lowl = copyOf('lowl', 'pick');

    expect(lowl.options).toHaveLength(3);
    for (const o of lowl.options) {
      expect(o.link?.href, o.id).toMatch(/^https:\/\/www\.lowl\.net\/services\/[a-z-]+\/$/);
      expect(o.link?.external, o.id).toBe(true);
    }
  });

  it("takes History Lens's scene from the app and marks what is in the record", () => {
    const hl = copyOf('history-lens', 'pick');

    expect(hl.intro[0].tag).toBe('Reconstructed');
    expect(hl.options.map((o) => o.label)).toEqual([
      'Ask them to take the handle off the pump',
      'Ask them to post a warning on the pump',
      'Ask them to close and fill the well',
    ]);
    /* what followed is tagged as the app tags it: what happened, or what happened only because of the choice */
    for (const o of hl.options) expect(['Documented', 'Your outcome'], o.id).toContain(o.result[0].tag);
    expect(hl.options.find((o) => o.id === 'handle')?.result[0].tag).toBe('Documented');
    expect(hl.end?.tag).toBe('History');
    expect(hl.end?.text).toMatch(/^What Snow asked for is not recorded\./);
  });
});

describe('Kana Notebook: three cards', () => {
  const copy: KanaTry = copyOf('kana-notebook', 'kana');
  const m = kanaMachine(copy);

  it('asks for the reading of the first card, with three readings to pick from', () => {
    const v = m.view(m.start());

    expect(v.step).toBe('card 1 of 3');
    expect(v.blocks[0]).toEqual({ kind: 'glyph', text: 'き', label: 'Card 1: a hiragana character' });
    expect(v.choices.map((c) => c.label).sort()).toEqual(['chi', 'ki', 'sa']);
    expect(v.done).toBe(false);
  });

  it('says plainly when a reading is right or wrong, and marks the right one in words', () => {
    const right = m.view(m.press(m.start(), 'ki'));
    const wrong = m.view(m.press(m.start(), 'sa'));

    expect(right.said).toBe('Right: き is ki.');
    expect(wrong.said).toBe('Not this one: き is ki.');
    expect(wrong.choices.find((c) => c.id === 'ki')?.mark).toBe('right');
    expect(wrong.choices.find((c) => c.id === 'sa')?.mark).toBe('not this one');
    expect(wrong.choices.filter((c) => c.disabled)).toHaveLength(3);
    expect(wrong.choices.at(-1)).toEqual({ id: NEXT_CARD, label: 'Next card' });
  });

  it('ignores a second pick on the same card and a next before a pick', () => {
    const s = m.press(m.start(), 'sa');

    expect(m.press(s, 'ki')).toBe(s);
    expect(m.press(m.start(), NEXT_CARD)).toEqual(m.start());
  });

  it('ends with the score, out of three, and the live link', () => {
    let s = m.start();
    for (const pickIt of ['ki', NEXT_CARD, 'ne', NEXT_CARD, 'a']) s = m.press(s, pickIt);
    const v = m.view(s);

    expect(v.done).toBe(true);
    expect(v.step).toBe('card 3 of 3');
    expect(v.said).toBe('Right: あ is a. 2 of 3.');
    expect(words(v)).toContain('2 of 3. The app has the other 43');
    expect(v.link?.href).toMatch(/^https:\/\/kana-notebook/);
    expect(v.choices.some((c) => c.id === NEXT_CARD)).toBe(false);
  });
});

describe('Emberquill: roll to hit an orc', () => {
  const copy: FightTry = copyOf('emberquill', 'fight');

  it('rolls dice by their faces', () => {
    expect(die(20, () => 0)).toBe(1);
    expect(die(20, () => 0.9999)).toBe(20);
    expect(die(8, () => face(5, 8))).toBe(5);
  });

  it('adds the bonus and compares it with the armour class: a hit rolls 1d8 + 3', () => {
    const a = attack(copy, queue(face(9, 20), face(4, 8)));

    expect(a).toEqual({ d20: 9, total: 14, hit: true, crit: false, damage: 7 });
    expect(attack(copy, queue(face(7, 20)))).toEqual({ d20: 7, total: 12, hit: false, crit: false, damage: 0 });
    /* exactly the armour class hits */
    expect(attack(copy, queue(face(8, 20), face(1, 8))).hit).toBe(true);
  });

  it('a natural 20 always hits and rolls the damage dice twice; a natural 1 always misses', () => {
    expect(attack(copy, queue(face(20, 20), face(8, 8), face(8, 8)))).toEqual({
      d20: 20,
      total: 25,
      hit: true,
      crit: true,
      damage: 19,
    });
    expect(attack({ ...copy, ac: 5 }, queue(face(1, 20))).hit).toBe(false);
  });

  it('shows the sum in words and takes the damage off the orc', () => {
    const m = fightMachine(copy, queue(face(14, 20), face(4, 8)));
    const v = m.view(m.press(m.start(), ROLL));

    expect(v.blocks).toContainEqual({ kind: 'roll', value: 14, n: 1 });
    expect(v.blocks).toContainEqual({ kind: 'text', text: '14 + 5 = 19 vs AC 13: hit, 7 damage', strong: true });
    expect(v.blocks).toContainEqual({ kind: 'meter', value: 8, max: 15, text: 'Orc: 8 of 15 hit points' });
    expect(v.said).toBe('14 + 5 = 19 vs AC 13: hit, 7 damage. Orc: 8 of 15 hit points.');
    expect(v.done).toBe(false);
  });

  it('says a critical hit and a natural 1 for what they are', () => {
    const crit = fightMachine(copy, queue(face(20, 20), face(2, 8), face(3, 8)));
    const one = fightMachine(copy, queue(face(1, 20)));

    expect(crit.view(crit.press(crit.start(), ROLL)).said).toMatch(
      /^20 \+ 5 = 25 vs AC 13: critical hit, double dice, 8 damage/,
    );
    expect(one.view(one.press(one.start(), ROLL)).said).toMatch(/^1 \+ 5 = 6 vs AC 13: a natural 1 always misses/);
  });

  it('goes on until the orc is down, then says how many rolls it took and links the live app', () => {
    const m = fightMachine(copy, seeded(7));
    let s = m.start();
    let rolls = 0;
    while (s.hp > 0 && rolls < 200) {
      s = m.press(s, ROLL);
      rolls++;
    }
    const v = m.view(s);

    expect(s.hp).toBe(0);
    expect(v.done).toBe(true);
    expect(v.choices).toEqual([]);
    expect(words(v)).toContain(`The orc is down, in ${rolls} roll`);
    expect(v.link?.href).toMatch(/^https:\/\//);
    /* a press after the end changes nothing */
    expect(m.press(s, ROLL)).toBe(s);
  });

  it('is the same fight for the same seed', () => {
    const play = (seed: number): number[] => {
      const m = fightMachine(copy, seeded(seed));
      let s = m.start();
      const out: number[] = [];
      for (let i = 0; i < 6; i++) {
        s = m.press(s, ROLL);
        out.push(s.last?.d20 ?? 0, s.hp);
      }
      return out;
    };
    expect(play(3)).toEqual(play(3));
  });
});

describe('The Front Desk: an example call', () => {
  const copy: CallTry = copyOf('front-desk', 'call');
  const m = callMachine(copy);

  it('starts marked as an example, waiting to be picked up', () => {
    const v = m.view(m.start());

    expect(words(v)).toContain('example call');
    expect(v.choices).toEqual([{ id: PICK_UP, label: 'Pick up' }]);
    expect(v.auto).toBeUndefined();
  });

  it('shows the lines one after another once picked up, then the booking', () => {
    let s = m.press(m.start(), PICK_UP);
    expect(m.view(s).auto).toBe(true);
    expect(m.view(s).choices).toEqual([]);

    s = m.press(s, NEXT);
    expect(m.view(s).said).toBe(`Caller: ${copy.lines[0].text}`);
    for (let i = 1; i < copy.lines.length; i++) s = m.press(s, NEXT);
    expect(m.view(s).blocks.filter((b) => b.kind === 'text' && b.who)).toHaveLength(copy.lines.length);
    expect(m.view(s).done).toBe(false);

    s = m.press(s, NEXT);
    const v = m.view(s);
    expect(v.done).toBe(true);
    expect(v.auto).toBe(false);
    expect(words(v)).toContain(copy.booked);
    expect(m.press(s, NEXT)).toBe(s);
  });

  it('has about four lines: the caller, the AI answering, a booking', () => {
    expect(copy.lines.length).toBeGreaterThanOrEqual(3);
    expect(copy.lines.length).toBeLessThanOrEqual(5);
    expect(new Set(copy.lines.map((l) => l.who))).toEqual(new Set(['Caller', 'AI']));
  });

  it('ignores anything but the pick-up before it is picked up', () => {
    expect(m.press(m.start(), NEXT)).toEqual(m.start());
  });
});

describe('a pick: History Lens, BookForge, the finance bot, LOWL', () => {
  it('History Lens: one choice, what followed with its tag, and what is in the record; the others close', () => {
    const copy: PickTry = copyOf('history-lens', 'pick');
    const m = pickMachine(copy);
    const start = m.view(m.start());

    expect(start.step).toBe('Soho, London, September 1854');
    expect(start.choices.every((c) => !c.disabled)).toBe(true);

    const s = m.press(m.start(), 'warning');
    const v = m.view(s);
    expect(v.done).toBe(true);
    /* only the choice made stays, marked in words; the scene makes room for what followed */
    expect(v.choices).toEqual([
      { id: 'warning', label: 'Ask them to post a warning on the pump', disabled: true, mark: 'your choice' },
    ]);
    expect(v.blocks).toEqual([{ kind: 'text', text: copy.ask, strong: true }]);
    expect(v.after).toContainEqual(expect.objectContaining({ kind: 'text', tag: 'Your outcome' }));
    expect(v.said).toContain('Your outcome: On Friday a printed notice is pasted to the pump');
    expect(v.said).toContain('History: What Snow asked for is not recorded.');
    expect(m.press(s, 'handle')).toBe(s);
  });

  it('BookForge: a fine line says so and stays marked; the wrong one shows the editor’s note and ends it', () => {
    const copy: PickTry = copyOf('bookforge', 'pick');
    const m = pickMachine(copy);
    const target = copy.options.find((o) => o.target);
    expect(copy.options.filter((o) => o.target)).toHaveLength(1);

    let s = m.press(m.start(), 'coffee');
    let v = m.view(s);
    expect(v.said).toBe('That one is fine.');
    expect(v.choices.find((c) => c.id === 'coffee')).toMatchObject({ disabled: true, mark: 'fine' });
    expect(v.done).toBe(false);

    s = m.press(s, target?.id ?? '');
    v = m.view(s);
    expect(v.done).toBe(true);
    expect(v.said).toContain('She can’t know that yet: the letter arrives two chapters later.');
    expect(v.choices.find((c) => c.id === target?.id)?.mark).toBe('this one');
    expect(v.choices.every((c) => c.disabled)).toBe(true);
  });

  it('the finance bot: every question shows its own answer and a bar, as often as you like', () => {
    const copy: PickTry = copyOf('numbers-room', 'pick');
    const m = pickMachine(copy);

    let s = m.press(m.start(), 'left');
    expect(m.view(s).after).toContainEqual({ kind: 'meter', value: 18_400, max: 60_000, text: '31%' });
    expect(m.view(s).choices.find((c) => c.id === 'left')?.pressed).toBe(true);
    s = m.press(s, 'travel');
    expect(m.view(s).said).toContain('9,800 of 12,000');
    expect(m.view(s).choices.find((c) => c.id === 'left')?.pressed).toBe(false);
    expect(m.view(s).choices.every((c) => !c.disabled)).toBe(true);
  });

  it("LOWL: what broke shows that service's real page", () => {
    const copy: PickTry = copyOf('lowl', 'pick');
    const m = pickMachine(copy);

    expect(m.view(m.start()).link).toBeUndefined();
    expect(m.view(m.press(m.start(), 'fridge')).link?.href).toBe('https://www.lowl.net/services/refrigerator-repair/');
    expect(m.view(m.press(m.start(), 'nothing'))).toEqual(m.view(m.start()));
  });
});

describe('every try', () => {
  it('can be finished in a few presses, from its first view, always with something to do until it is', () => {
    for (const [slug, copy] of Object.entries(TRIES)) {
      const run = startTry(copy, seeded(11));
      let v = run.view();
      let presses = 0;
      while (!v.done && presses < 60) {
        const next = v.auto ? NEXT : v.choices.find((c) => !c.disabled && c.mark === undefined)?.id;
        expect(next, `${slug}: stuck with nothing to press`).toBeDefined();
        v = run.press(next ?? NEXT);
        presses++;
      }
      expect(v.done, slug).toBe(true);
      expect(v.said.trim(), slug).not.toBe('');
    }
  });
});
