export const CODE_MAX = 64 * 1024;
export const CODE_WARN = 32 * 1024;

/**
 * @param {Record<string, { file: string, isEntry?: boolean, imports?: string[], css?: string[] }>} manifest
 * @returns {Set<string>} chunk keys reachable from entries through static imports
 */
export function sharedKeys(manifest) {
  const seen = new Set();
  const visit = (key) => {
    if (seen.has(key) || !manifest[key]) return;
    seen.add(key);
    for (const k of manifest[key].imports ?? []) visit(k);
  };
  for (const [key, chunk] of Object.entries(manifest)) if (chunk.isEntry) visit(key);
  return seen;
}

/** @returns {string[]} dist-relative files (js + css) that belong to one game */
export function gameFiles(manifest, id) {
  const root = `src/games/${id}/index.ts`;
  if (!manifest[root]) return [];
  const shared = sharedKeys(manifest);
  const files = new Set();
  const seen = new Set();
  const visit = (key) => {
    const chunk = manifest[key];
    if (!chunk || seen.has(key) || shared.has(key)) return;
    seen.add(key);
    files.add(chunk.file);
    for (const c of chunk.css ?? []) files.add(c);
    for (const k of chunk.imports ?? []) visit(k);
  };
  visit(root);
  return [...files];
}

export const gameIds = (manifest) =>
  Object.keys(manifest)
    .map((k) => /^src\/games\/([^/]+)\/index\.ts$/.exec(k)?.[1])
    .filter(Boolean);

/** @param {(file: string) => number} gzipSize @param {string} [only] @returns {{ errors: string[], warnings: string[], sizes: Record<string, number> }} */
export function checkBudget(manifest, gzipSize, only) {
  const errors = [];
  const warnings = [];
  const sizes = {};
  for (const id of gameIds(manifest)) {
    if (only && id !== only) continue;
    const total = gameFiles(manifest, id).reduce((sum, f) => sum + gzipSize(f), 0);
    sizes[id] = total;
    if (total > CODE_MAX) errors.push(`${id}: ${total} bytes gzip exceeds the ${CODE_MAX} byte code budget`);
    else if (total > CODE_WARN) warnings.push(`${id}: ${total} bytes gzip exceeds the ${CODE_WARN} byte warning level`);
  }
  if (only && !(only in sizes)) errors.push(`${only}: no chunk found in the build manifest (is the game built?)`);
  return { errors, warnings, sizes };
}
