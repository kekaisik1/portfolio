import { describe, expect, it } from 'vitest';
import { scrambled } from '../../src/board/scramble';
import { SWIPE_MIN_PX, keyTarget, newWheelGate, swipeStep, wheelStep } from '../../src/travel/gesture';

describe('keys', () => {
  it('step one row with the arrows, Page keys and j/k, and stop at the ends', () => {
    expect(keyTarget('ArrowDown', 3, 9)).toBe(4);
    expect(keyTarget('ArrowRight', 3, 9)).toBe(4);
    expect(keyTarget('PageDown', 3, 9)).toBe(4);
    expect(keyTarget('j', 3, 9)).toBe(4);
    expect(keyTarget('ArrowUp', 3, 9)).toBe(2);
    expect(keyTarget('ArrowLeft', 3, 9)).toBe(2);
    expect(keyTarget('k', 3, 9)).toBe(2);
    expect(keyTarget('ArrowDown', 9, 9)).toBe(9);
    expect(keyTarget('ArrowUp', 0, 9)).toBe(0);
  });

  it('jump to the ends with Home and End', () => {
    expect(keyTarget('Home', 5, 9)).toBe(0);
    expect(keyTarget('End', 5, 9)).toBe(9);
  });

  it('leave every other key alone', () => {
    for (const key of ['Tab', 'Enter', ' ', 'a', 'Escape']) expect(keyTarget(key, 3, 9)).toBeNull();
  });
});

describe('the wheel', () => {
  it('takes one step for a whole trackpad fling', () => {
    const gate = newWheelGate();
    const steps = Array.from({ length: 30 }, (_, i) => wheelStep(gate, 1000 + i * 16, 40, 0));

    expect(steps[0]).toBe(1);
    expect(steps.slice(1).every((s) => s === 0)).toBe(true);
  });

  it('steps again after a pause, and back for an upward turn', () => {
    const gate = newWheelGate();

    expect(wheelStep(gate, 1000, 100, 0)).toBe(1);
    expect(wheelStep(gate, 1400, -100, 0)).toBe(-1);
  });

  it('lets a long hard spin step again, but not sooner than 700 ms', () => {
    const gate = newWheelGate();

    expect(wheelStep(gate, 0, 120, 0)).toBe(1);
    expect(wheelStep(gate, 100, 120, 0)).toBe(0);
    expect(wheelStep(gate, 200, 120, 0)).toBe(0);
    expect(wheelStep(gate, 300, 120, 0)).toBe(0);
    expect(wheelStep(gate, 400, 120, 0)).toBe(0);
    expect(wheelStep(gate, 500, 120, 0)).toBe(0);
    expect(wheelStep(gate, 600, 120, 0)).toBe(0);
    expect(wheelStep(gate, 710, 120, 0)).toBe(1);
  });

  it('ignores sideways scrolling and the tail of a gesture', () => {
    const gate = newWheelGate();

    expect(wheelStep(gate, 0, 10, 80)).toBe(0);
    expect(wheelStep(gate, 1000, 2, 0)).toBe(0);
  });
});

describe('a swipe', () => {
  it('goes on for a swipe up and back for a swipe down', () => {
    expect(swipeStep(0, -120)).toBe(1);
    expect(swipeStep(10, 120)).toBe(-1);
  });

  it('is nothing when short or mostly sideways', () => {
    expect(swipeStep(0, -(SWIPE_MIN_PX - 1))).toBe(0);
    expect(swipeStep(150, -100)).toBe(0);
  });
});

describe('the status word cycling', () => {
  const pick = (): string => '#';

  it('locks characters from the left and keeps spaces', () => {
    expect(scrambled('IN USE', 0, pick)).toBe('## ###');
    expect(scrambled('IN USE', 0.5, pick)).toBe('IN ###');
    expect(scrambled('IN USE', 1, pick)).toBe('IN USE');
  });

  it('never changes the length, so nothing on the board shifts', () => {
    for (const p of [0, 0.2, 0.7, 0.99]) expect(scrambled('BUILDING', p, pick)).toHaveLength(8);
  });
});
