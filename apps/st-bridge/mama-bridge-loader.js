/**
 * Hosted Project MAMA SillyTavern loader entry.
 *
 * Import this from JS-Slash-Runner for local host / GitHub Pages use:
 *   import 'http://127.0.0.1:4173/apps/st-bridge/mama-bridge-loader.js?env=local&force=1&v=dev';
 */
const CURRENT_URL = new URL(import.meta.url);
const LOADER_URL = new URL('../../ST/mama-bridge-loader.js', CURRENT_URL);

for (const [key, value] of CURRENT_URL.searchParams.entries()) {
  LOADER_URL.searchParams.set(key, value);
}

const REQUESTED_ENV = CURRENT_URL.searchParams.get('env') || CURRENT_URL.searchParams.get('mode');
if (REQUESTED_ENV) window.MAMA_LOADER_ENV = REQUESTED_ENV;

await import(LOADER_URL.href);
