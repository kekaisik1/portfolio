/** The page's one API client, configured from the build's environment (see .env.example). */
import { createApi } from './client';
import { resolveApiBase } from './config';

export const api = createApi(
  resolveApiBase(import.meta.env.VITE_API_URL, location.hostname, import.meta.env.VITE_LOCAL_API_PORT),
);
export type { Api, ApiFailure, ApiResult, NoteBody } from './client';
