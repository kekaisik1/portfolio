/**
 * Which videos exist. A video is `public/videos/<slug>.mp4`, with optional captions `public/videos/<slug>.vtt`.
 * The list is made at build time (see vite.config.ts), so the page never asks for a file that is not there.
 */
import { readdirSync } from 'node:fs';

export interface VideoEntry {
  /** file name inside videos/ */
  src: string;
  /** captions file name inside videos/, if there is one */
  captions?: string;
}
export type VideoManifest = Record<string, VideoEntry>;

const SLUG = /^[a-z0-9-]{1,40}$/;

/** From a list of file names to a manifest keyed by project slug. Captions without a video are ignored. */
export function buildVideoManifest(fileNames: readonly string[]): VideoManifest {
  const names = new Set(fileNames);
  const manifest: VideoManifest = {};
  for (const name of [...names].sort()) {
    if (!name.toLowerCase().endsWith('.mp4')) continue;
    const slug = name.slice(0, -4);
    if (!SLUG.test(slug)) continue;
    const entry: VideoEntry = { src: name };
    if (names.has(`${slug}.vtt`)) entry.captions = `${slug}.vtt`;
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
  return buildVideoManifest(files);
}
