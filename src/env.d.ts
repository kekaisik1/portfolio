/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Address of the API; empty = the page runs on its own. */
  readonly VITE_API_URL?: string;
  /** Port of a local API copy, used only on localhost when VITE_API_URL is set. */
  readonly VITE_LOCAL_API_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'virtual:videos' {
  import type { VideoManifest } from '../scripts/video-manifest';
  /** Which projects have a video in public/videos/, made at build time. */
  const videos: VideoManifest;
  export default videos;
}
