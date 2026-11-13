/**
 * Make the world photographs the page loads, from a folder of source pictures (3:2 PNG or JPEG, 1536x1024 or bigger):
 *
 *   npm run worlds -- <source folder>
 *
 * For every world it writes public/worlds/<id>.webp (landscape), public/worlds/<id>-m.webp (an upright crop for
 * phones, taken around the photo's subject) and a tiny blurred stand-in for each into src/worlds/placeholders.json.
 * Needs ffmpeg with libwebp. A unit test caps the size of every file this writes.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { TALL_SIZE, WIDE_SIZE, tallCropX } from '../src/worlds/cover.ts';
import { lookOf } from '../src/worlds/looks.ts';

/** Which source file (without extension) is which world's photograph. The world ids are those of src/content/places.ts. */
export const SOURCES: Readonly<Record<string, string>> = {
  hello: 'peak',
  'front-desk': 'voice-receptionist',
  'numbers-room': 'data-assistant',
  lowl: 'lowl',
  emberquill: 'emberquill',
  'history-lens': 'history-lens',
  bookforge: 'bookforge',
  'kana-notebook': 'kana-notebook',
  about: 'about',
  contact: 'dnd-companion',
};

/* No upscaling: the sources are 1536x1024, so that is the landscape size; the upright crop is 683x1024. */
const WIDE = WIDE_SIZE;
const TALL = TALL_SIZE;
const QUALITY = 84;
const STAND_IN = { wide: 24, tall: 16, quality: 40 };

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'public/worlds');
const PLACEHOLDERS = join(ROOT, 'src/worlds/placeholders.json');

function ffmpeg(args: string[]): void {
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
}

function findSource(dir: string, file: string): string {
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const path = join(dir, `${file}.${ext}`);
    if (existsSync(path)) return path;
  }
  throw new Error(`No ${file}.png (or .jpg, .jpeg, .webp) in ${dir}: every world needs its photograph.`);
}

/** The ffmpeg filter that cuts the upright crop out of a landscape picture scaled to WIDE, around the subject. */
export function tallCrop(focus: number): string {
  return `scale=${WIDE.w}:${WIDE.h}:flags=lanczos,crop=${TALL.w}:${TALL.h}:${tallCropX(focus)}:0`;
}

const webp = (quality: number): string[] => ['-c:v', 'libwebp', '-quality', String(quality), '-compression_level', '6'];
const dataUri = (path: string): string => `data:image/webp;base64,${readFileSync(path).toString('base64')}`;

function main(): void {
  const dir = process.argv[2];
  if (!dir || !existsSync(dir)) {
    console.error('usage: npm run worlds -- <folder with the source photographs>');
    process.exit(2);
  }
  mkdirSync(OUT, { recursive: true });
  const work = mkdtempSync(join(tmpdir(), 'worlds-'));
  const placeholders: Record<string, { wide: string; tall: string }> = {};
  try {
    for (const [id, file] of Object.entries(SOURCES)) {
      const src = findSource(dir, file);
      const crop = tallCrop(lookOf(id).focus);
      ffmpeg(['-i', src, '-vf', `scale=${WIDE.w}:${WIDE.h}:flags=lanczos`, ...webp(QUALITY), join(OUT, `${id}.webp`)]);
      ffmpeg(['-i', src, '-vf', crop, ...webp(QUALITY), join(OUT, `${id}-m.webp`)]);
      const wide = join(work, 'w.webp');
      const tall = join(work, 't.webp');
      ffmpeg(['-i', src, '-vf', `scale=${STAND_IN.wide}:-2`, ...webp(STAND_IN.quality), wide]);
      ffmpeg(['-i', src, '-vf', `${crop},scale=${STAND_IN.tall}:-2`, ...webp(STAND_IN.quality), tall]);
      placeholders[id] = { wide: dataUri(wide), tall: dataUri(tall) };
      console.log(`${id}: done`);
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  writeFileSync(PLACEHOLDERS, JSON.stringify(placeholders, null, 2) + '\n');
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) main();
