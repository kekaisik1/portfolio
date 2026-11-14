/**
 * What a "try it" panel shows at one moment. Every kind of try (src/try/*.ts) is a small pure state machine whose
 * state turns into one of these; the panel (panel.ts) only draws it, so all the behaviour is unit-tested here.
 */
import type { ProjectLink } from '../content/types';

export type Block =
  /** a line of text, maybe with who says it ("Caller") or a tag in front ("Documented") */
  | { kind: 'text'; text: string; tag?: string; who?: string; strong?: boolean; quiet?: boolean }
  /** one big character (a kana card); `label` is what a screen reader hears instead */
  | { kind: 'glyph'; text: string; label: string }
  /** a plain bar: `value` of `max` */
  | { kind: 'meter'; value: number; max: number; text: string }
  /** a d20 that has just been rolled: `n` counts the rolls, so the panel knows a new one has landed */
  | { kind: 'roll'; value: number; n: number };

export interface Choice {
  id: string;
  label: string;
  /** what the choice turned out to be, in words (never colour alone): "right", "your choice" */
  mark?: string;
  disabled?: boolean;
  /** 'any' choices: the one whose answer is showing */
  pressed?: boolean;
}

export interface TryView {
  /** the small line at the top: "card 2 of 3"; empty for none */
  step: string;
  /** what stands above the choices (the question) and under them (what the last press meant) */
  blocks: readonly Block[];
  choices: readonly Choice[];
  after: readonly Block[];
  /** what a screen reader is told after the last press (empty: nothing new) */
  said: string;
  done: boolean;
  /** the panel should press `next` by itself after a pause (an example call, line by line) */
  auto?: boolean;
  /** where it ends: a live site, a real page */
  link?: ProjectLink;
}

/** One kind of try: where it starts, what a press does, and what that looks like. Pure. */
export interface TryMachine<S> {
  start(): S;
  press(state: S, id: string): S;
  view(state: S): TryView;
}

/** the id the panel presses by itself while `auto` is set */
export const NEXT = 'next';
