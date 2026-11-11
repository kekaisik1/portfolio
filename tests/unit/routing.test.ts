import { readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PROJECTS } from '../../src/content/projects';
import { OLD_LINKS, arrowStop, hashTarget, insideSlug } from '../../src/nav/routing';
import { buildVideoManifest, readVideoManifest } from '../../scripts/video-manifest';
import { videoUrl } from '../../src/inside/video';

describe('hash routing', () => {
  it('reads a place slug from the address', () => {
    expect(hashTarget('#emberquill')).toBe('emberquill');
    expect(hashTarget('#sea')).toBe('sea');
  });

  it('sends old links to the place that took them over', () => {
    expect(hashTarget('#voice-receptionist')).toBe('front-desk');
    expect(hashTarget('#crm')).toBe('front-desk');
    expect(hashTarget('#data-assistant')).toBe('numbers-room');
    expect(hashTarget('#kana')).toBe('kana-notebook');
  });

  it('only redirects old links to projects that exist', () => {
    const known = new Set([...PROJECTS.map((p) => p.slug), 'about']);

    for (const target of Object.values(OLD_LINKS)) expect(known).toContain(target);
  });

  it('is empty for no hash or a malformed one, and is not fooled by object property names', () => {
    expect(hashTarget('')).toBe('');
    expect(hashTarget('#%E0%A4%A')).toBe('');
    expect(hashTarget('#constructor')).toBe('constructor');
  });

  it('decodes an escaped hash', () => {
    expect(hashTarget('#kana%2Dnotebook')).toBe('kana-notebook');
  });

  it('knows which place a history entry was made inside of', () => {
    expect(insideSlug({ inside: 'lowl' })).toBe('lowl');
    expect(insideSlug({ inside: 3 })).toBeNull();
    expect(insideSlug(null)).toBeNull();
    expect(insideSlug('lowl')).toBeNull();
  });
});

describe('arrow keys between stops', () => {
  const stops = [0, 1000, 2000, 3000];

  it('goes to the next stop from a stop', () => {
    expect(arrowStop(1, 1000, stops, 1)).toBe(2);
    expect(arrowStop(-1, 1000, stops, 1)).toBe(0);
  });

  it('finishes the way to a stop you are between and have not reached', () => {
    expect(arrowStop(1, 900, stops, 1)).toBe(1);
    expect(arrowStop(-1, 1100, stops, 1)).toBe(1);
  });
});

describe('video manifest', () => {
  it('lists each mp4 by slug, with captions when a vtt of the same name exists', () => {
    const manifest = buildVideoManifest(['kana-notebook.mp4', 'emberquill.mp4', 'emberquill.vtt', 'README.txt']);

    expect(manifest).toEqual({
      emberquill: { src: 'emberquill.mp4', captions: 'emberquill.vtt' },
      'kana-notebook': { src: 'kana-notebook.mp4' },
    });
  });

  it('ignores captions without a video and files that are not slugs', () => {
    expect(buildVideoManifest(['lowl.vtt', 'My Video.mp4', '.mp4', 'notes.md'])).toEqual({});
  });

  it('is empty when the videos folder does not exist', () => {
    expect(readVideoManifest('/nonexistent/videos/folder')).toEqual({});
  });

  it('has a video for a real project in public/videos', () => {
    const manifest = readVideoManifest('public/videos');
    const slugs = PROJECTS.map((p) => p.slug);

    expect(manifest['kana-notebook']).toEqual({ src: 'kana-notebook.mp4' });
    for (const slug of Object.keys(manifest)) expect(slugs).toContain(slug);
  });

  it('keeps every video in public/videos to 2 MB or less (npm run video -- <file> <slug> makes one that fits)', () => {
    const maxBytes = 2 * 1024 * 1024;
    const videos = readdirSync('public/videos').filter((name) => name.endsWith('.mp4'));

    expect(videos.length).toBeGreaterThan(0);
    for (const name of videos) expect(statSync(`public/videos/${name}`).size, name).toBeLessThanOrEqual(maxBytes);
  });

  it('builds video addresses under the base the site is served from', () => {
    expect(videoUrl('kana-notebook.mp4', '/portfolio/')).toBe('/portfolio/videos/kana-notebook.mp4');
  });
});
