import { SvelteURLSearchParams } from 'svelte/reactivity';

export type RouteName = 'lobby' | 'session' | 'practice' | 'gallery';

export interface Route {
  name: RouteName;
  id?: string;
  query: URLSearchParams;
  key: string;
}

export function parseHash(hash: string): Route | null {
  const raw = hash.replace(/^#/, '') || '/';
  const q = raw.indexOf('?');
  const path = q < 0 ? raw : raw.slice(0, q);
  const search = q < 0 ? '' : raw.slice(q + 1);
  const query = new SvelteURLSearchParams(search);
  const key = `${path}?${search}`;
  if (path === '/' || path === '') return { name: 'lobby', query, key };
  if (path === '/session') return { name: 'session', query, key };
  if (path === '/gallery') return { name: 'gallery', query, key };
  const play = /^\/play\/([^/]+)$/.exec(path);
  if (play) return { name: 'practice', id: decodeURIComponent(play[1]!), query, key };
  return null;
}

let hash = $state(window.location.hash);

function sync() {
  if (!parseHash(window.location.hash)) window.location.replace('#/');
  hash = window.location.hash;
}
window.addEventListener('hashchange', sync);
sync();

export const router = {
  get route(): Route {
    return parseHash(hash) ?? { name: 'lobby', query: new SvelteURLSearchParams(), key: '/?' };
  },
};

export function numParam(query: URLSearchParams, name: string, fallback: number, min: number, max: number): number {
  const raw = query.get(name);
  const n = raw === null || raw.trim() === '' ? NaN : Number(raw);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
