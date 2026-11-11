/** Where the API lives, if anywhere. */

const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1)$/;

/**
 * The API base address for this page, or '' when the page should run on its own.
 * - nothing configured -> '' (nothing is ever sent anywhere)
 * - configured, and the page is open on localhost -> a local copy on `localPort`, so trying things out never touches the real one
 * - otherwise the configured address, without a trailing slash; anything that is not http(s) counts as nothing
 */
export function resolveApiBase(configured: string | undefined, hostname: string, localPort = '8787'): string {
  let u = (configured ?? '').trim();
  if (u && LOCAL_HOSTS.test(hostname)) u = `http://${hostname}:${localPort || '8787'}`;
  return /^https?:\/\//.test(u) ? u.replace(/\/+$/, '') : '';
}
