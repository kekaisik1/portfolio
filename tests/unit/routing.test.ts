import { readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WORLDS } from '../../src/content/places';
import { PROJECTS } from '../../src/content/projects';
import { OLD_LINKS, hashOfWorld, hashTarget, worldOfHash } from '../../src/nav/routing';
import { buildVideoManifest, mp4Seconds, readVideoManifest } from '../../scripts/video-manifest';
import { videoOf, videoUrl } from '../../src/video/files';

describe('hash routing', () => {
  it('reads a world id from the address', () => {
    expect(hashTarget('#emberquill')).toBe('emberquill');
    expect(hashTarget('#about')).toBe('about');
  });

  it('lands #kana-notebook on Kyoto, and #about and #contact on their rows', () => {
    expect(WORLDS[worldOfHash('#kana-notebook')].place).toBe('Kyoto');
    expect(worldOfHash('#about')).toBe(8);
    expect(worldOfHash('#contact')).toBe(9);
    expect(worldOfHash('#nowhere')).toBe(-1);
    expect(worldOfHash('')).toBe(-1);
  });

  it('gives every world a #link, except the summit, which is the bare address', () => {
    expect(hashOfWorld(0, 'hello')).toBe('');
    expect(hashOfWorld(7, 'kana-notebook')).toBe('#kana-notebook');
    for (const [i, w] of WORLDS.entries()) if (i > 0) expect(worldOfHash(hashOfWorld(i, w.id))).toBe(i);
  });

  it('sends old links to the world that took them over', () => {
    expect(hashTarget('#voice-receptionist')).toBe('front-desk');
    expect(hashTarget('#crm')).toBe('front-desk');
    expect(hashTarget('#data-assistant')).toBe('numbers-room');
    expect(hashTarget('#kana')).toBe('kana-notebook');
    expect(worldOfHash('#sea')).toBe(worldOfHash('#history-lens'));
    expect(worldOfHash('#mountains')).toBe(0);
  });

  it('only redirects old links to worlds that exist', () => {
    const known = new Set(WORLDS.map((w) => w.id));

    for (const target of Object.values(OLD_LINKS)) expect(known).toContain(target);
  });

  it('is empty for no hash or a malformed one, and is not fooled by object property names', () => {
    expect(hashTarget('')).toBe('');
    expect(hashTarget('#%E0%A4%A')).toBe('');
    expect(hashTarget('#constructor')).toBe('constructor');
    expect(worldOfHash('#constructor')).toBe(-1);
  });

  it('decodes an escaped hash', () => {
    expect(hashTarget('#kana%2Dnotebook')).toBe('kana-notebook');
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

  it('records how long a video runs, in whole seconds, when that can be read', () => {
    const manifest = buildVideoManifest(['a.mp4', 'b.mp4'], (name) => (name === 'a.mp4' ? 43.6 : null));

    expect(manifest).toEqual({ a: { src: 'a.mp4', seconds: 44 }, b: { src: 'b.mp4' } });
  });

  it('ignores captions without a video and files that are not slugs', () => {
    expect(buildVideoManifest(['lowl.vtt', 'My Video.mp4', '.mp4', 'notes.md'])).toEqual({});
  });

  it('is empty when the videos folder does not exist', () => {
    expect(readVideoManifest('/nonexistent/videos/folder')).toEqual({});
  });

  it('reads the running time from an MP4 movie header, and gives up politely on anything else', () => {
    const box = (type: string, body: Buffer): Buffer => {
      const head = Buffer.alloc(8);
      head.writeUInt32BE(8 + body.length, 0);
      head.write(type, 4, 'latin1');
      return Buffer.concat([head, body]);
    };
    const mvhd = Buffer.alloc(20);
    mvhd.writeUInt32BE(600, 12);
    mvhd.writeUInt32BE(26400, 16);
    const file = Buffer.concat([box('ftyp', Buffer.from('isom')), box('moov', box('mvhd', mvhd))]);

    expect(mp4Seconds(file)).toBe(44);
    expect(mp4Seconds(Buffer.from('not a video at all'))).toBeNull();
    expect(mp4Seconds(Buffer.alloc(0))).toBeNull();
  });

  it('has a video with a real length for real projects in public/videos', () => {
    const manifest = readVideoManifest('public/videos');
    const slugs = PROJECTS.map((p) => p.slug);

    expect(manifest['kana-notebook']).toEqual({ src: 'kana-notebook.mp4', seconds: 44 });
    for (const [slug, entry] of Object.entries(manifest)) {
      expect(slugs).toContain(slug);
      expect(entry.seconds, slug).toBeGreaterThan(0);
    }
  });

  it('keeps every video in public/videos to 2 MB or less (npm run video -- <file> <slug> makes one that fits)', () => {
    const maxBytes = 2 * 1024 * 1024;
    const videos = readdirSync('public/videos').filter((name) => name.endsWith('.mp4'));

    expect(videos.length).toBeGreaterThan(0);
    for (const name of videos) expect(statSync(`public/videos/${name}`).size, name).toBeLessThanOrEqual(maxBytes);
  });

  it('knows which projects have a video', () => {
    expect(videoOf('kana-notebook')?.src).toBe('kana-notebook.mp4');
    expect(videoOf('lowl')).toBeNull();
    expect(videoOf('constructor')).toBeNull();
  });

  it('builds video addresses under the base the site is served from', () => {
    expect(videoUrl('kana-notebook.mp4', '/portfolio/')).toBe('/portfolio/videos/kana-notebook.mp4');
  });
});
