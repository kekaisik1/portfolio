/**
 * Which videos exist, and how long each runs. A video is `public/videos/<slug>.mp4`, with optional captions
 * `public/videos/<slug>.vtt`. The list is made at build time (see vite.config.ts), so the page never asks for a
 * file that is not there, and "Watch 0:44" is written into the page without loading the video.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface VideoEntry {
  /** file name inside videos/ */
  src: string;
  /** captions file name inside videos/, if there is one */
  captions?: string;
  /** how long it runs, in whole seconds, when the file says */
  seconds?: number;
}
export type VideoManifest = Record<string, VideoEntry>;

const SLUG = /^[a-z0-9-]{1,40}$/;
const BOX_HEADER = 8;

/** Where a box of the given type starts and ends inside [from, to), or null. */
function findBox(buf: Buffer, type: string, from: number, to: number): { start: number; end: number } | null {
  let at = from;
  while (at + BOX_HEADER <= to) {
    let size = buf.readUInt32BE(at);
    let header = BOX_HEADER;
    if (size === 1) {
      /* a 64-bit size follows the type */
      if (at + 16 > to) return null;
      size = Number(buf.readBigUInt64BE(at + 8));
      header = 16;
    } else if (size === 0) size = to - at;
    if (size < header) return null;
    if (buf.toString('latin1', at + 4, at + 8) === type) return { start: at + header, end: Math.min(to, at + size) };
    at += size;
  }
  return null;
}

/** The running time of an MP4 in seconds, from its movie header (moov > mvhd); null when it cannot be read. */
export function mp4Seconds(buf: Buffer): number | null {
  const moov = findBox(buf, 'moov', 0, buf.length);
  if (!moov) return null;
  const mvhd = findBox(buf, 'mvhd', moov.start, moov.end);
  if (!mvhd) return null;
  const version = buf.readUInt8(mvhd.start);
  /* version 0: 32-bit times; version 1: 64-bit. After version+flags come created, modified, timescale, duration. */
  const wide = version === 1;
  const scaleAt = mvhd.start + 4 + (wide ? 16 : 8);
  if (scaleAt + (wide ? 12 : 8) > mvhd.end) return null;
  const timescale = buf.readUInt32BE(scaleAt);
  const duration = wide ? Number(buf.readBigUInt64BE(scaleAt + 4)) : buf.readUInt32BE(scaleAt + 4);
  if (!timescale || !Number.isFinite(duration)) return null;
  return duration / timescale;
}

/**
 * From a list of file names to a manifest keyed by project slug. Captions without a video are ignored.
 * `secondsOf` reads a video's running time (null = unknown).
 */
export function buildVideoManifest(
  fileNames: readonly string[],
  secondsOf: (name: string) => number | null = () => null,
): VideoManifest {
  const names = new Set(fileNames);
  const manifest: VideoManifest = {};
  for (const name of [...names].sort()) {
    if (!name.toLowerCase().endsWith('.mp4')) continue;
    const slug = name.slice(0, -4);
    if (!SLUG.test(slug)) continue;
    const entry: VideoEntry = { src: name };
    if (names.has(`${slug}.vtt`)) entry.captions = `${slug}.vtt`;
    const seconds = secondsOf(name);
    if (seconds !== null && seconds > 0) entry.seconds = Math.round(seconds);
    manifest[slug] = entry;
  }
  return manifest;
}

/** Read a videos folder; a missing folder simply means no videos yet. */
export function readVideoManifest(dir: string): VideoManifest {
  let files: string[];
  try {
    files = readdirSync(dir);
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') return {};
    throw err;
  }
  return buildVideoManifest(files, (name) => mp4Seconds(readFileSync(join(dir, name))));
}
