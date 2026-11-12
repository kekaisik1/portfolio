/** Which projects have a video, and where its file is. No DOM, so it is unit-tested. */
import videos from 'virtual:videos';
import type { VideoEntry } from '../../scripts/video-manifest';

/** Address of a file in public/videos/, under whatever base the site is served from. */
export const videoUrl = (file: string, base: string = import.meta.env.BASE_URL): string => `${base}videos/${file}`;

/** A project's video (public/videos/<slug>.mp4, found at build time), or null when it has none. */
export const videoOf = (slug: string): VideoEntry | null => (Object.hasOwn(videos, slug) ? videos[slug] : null);
