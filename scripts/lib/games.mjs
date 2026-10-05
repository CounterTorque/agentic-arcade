import fs from 'node:fs';
import path from 'node:path';

export const ID_RE = /^[a-z][a-z0-9-]{1,30}$/;
export const CONTROL_HINT_RE = /^[^(),]+ \([^()]+\)(, [^(),]+ \([^()]+\))*$/;
export const VERB_RE = /^[A-Z][A-Z !?]{0,11}$/;
export const ASSET_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg'];
export const CODE_EXTS = ['.ts', '.js', '.mjs', '.svelte', '.css'];
export const ASSET_TOTAL_MAX = 1.5 * 1024 * 1024;
export const ASSET_TOTAL_WARN = 750 * 1024;
export const ASSET_FILE_MAX = 512 * 1024;
export const REQUIRED_FILES = ['manifest.ts', 'index.ts', 'README.md'];
const IGNORED_FILES = new Set(['README.md', '.gitkeep', '.DS_Store']);
const TEST_BARE = new Set(['vitest', '@playwright/test']);

export const isTestFile = (file) => /\.(test|e2e)\.ts$/.test(file);

/** @param {string} dir @returns {string[]} */
export function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

/** @param {string} source @returns {{ specifiers: string[], problems: string[] }} */
export function extractImports(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
  const specifiers = [];
  const problems = [];
  for (const re of [
    /\bimport\s+(?:[^'"()]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bexport\s+(?:[^'"()]*?\s+)?from\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]) {
    for (const m of code.matchAll(re)) specifiers.push(m[1]);
  }
  if (/\bimport\s*\(\s*(?!['"])/.test(code)) problems.push('dynamic import() must use a string literal');
  if (/\bimport\.meta\.glob\b/.test(code)) problems.push('import.meta.glob is not allowed in games');
  return { specifiers, problems };
}

/**
 * @param {string} spec
 * @param {{ file: string, gameDir: string, root: string, isManifest: boolean, isTest: boolean }} c
 * @returns {string | null}
 */
export function importViolation(spec, { file, gameDir, root, isManifest, isTest }) {
  const inside = (base, target) => target === base || target.startsWith(base + path.sep);
  if (spec.startsWith('.') || spec.startsWith('/')) {
    if (isManifest) return `manifest.ts may import only @arcade/sdk (found "${spec}")`;
    const target = spec.startsWith('/') ? spec : path.resolve(path.dirname(file), spec);
    if (inside(gameDir, target)) return null;
    if (isTest && inside(path.join(root, 'tests', 'helpers'), target)) return null;
    return `import "${spec}" resolves outside ${path.relative(root, gameDir)}/`;
  }
  if (spec === '@arcade/sdk') return null;
  if (isManifest) return `manifest.ts may import only @arcade/sdk (found "${spec}")`;
  if (spec === 'svelte' || spec.startsWith('svelte/')) return null;
  if (isTest && TEST_BARE.has(spec)) return null;
  return `import "${spec}" is not allowed (allowed: @arcade/sdk, svelte, svelte/*)`;
}

/** @param {string} css @param {string} id @returns {string[]} selectors that violate the prefix rule */
export function badCssSelectors(css, id) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const prefixes = [`[data-game="${id}"]`, `[data-game='${id}']`];
  const bad = [];
  const skipBlock = (i) => {
    let depth = 1;
    while (i < text.length && depth > 0) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') depth--;
      i++;
    }
    return i;
  };
  const parse = (start) => {
    let i = start;
    let prelude = '';
    while (i < text.length) {
      const ch = text[i];
      if (ch === '}') return i + 1;
      if (ch === ';') {
        prelude = '';
        i++;
      } else if (ch === '{') {
        const p = prelude.trim();
        if (p.startsWith('@')) {
          i = /^@(media|supports|layer|container|scope)\b/.test(p) ? parse(i + 1) : skipBlock(i + 1);
        } else {
          for (const sel of splitSelectors(p)) if (!prefixes.some((x) => sel.startsWith(x))) bad.push(sel);
          i = skipBlock(i + 1);
        }
        prelude = '';
      } else {
        prelude += ch;
        i++;
      }
    }
    return i;
  };
  parse(0);
  return bad;
}

function splitSelectors(s) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** @param {{ root: string, only?: string }} o @returns {{ errors: string[], warnings: string[], checked: string[] }} */
export function checkGames({ root, only }) {
  const gamesRoot = path.join(root, 'src', 'games');
  const errors = [];
  const warnings = [];
  const fail = (id, msg) => errors.push(`${id}: ${msg}`);
  if (!fs.existsSync(gamesRoot)) return { errors, warnings, checked: [] };
  let dirs = fs.readdirSync(gamesRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  if (only) {
    if (!dirs.includes(only)) return { errors: [`${only}: directory src/games/${only} does not exist`], warnings, checked: [] };
    dirs = [only];
  }
  for (const id of dirs) {
    const gameDir = path.join(gamesRoot, id);
    if (!ID_RE.test(id)) fail(id, `directory name must match ${ID_RE}`);
    for (const f of REQUIRED_FILES) if (!fs.existsSync(path.join(gameDir, f))) fail(id, `missing required file ${f}`);
    const files = walk(gameDir);
    if (!files.some((f) => /\.test\.ts$/.test(f))) fail(id, 'needs at least one *.test.ts file');
    let assetTotal = 0;
    for (const file of files) {
      const rel = path.relative(gameDir, file);
      const ext = path.extname(file).toLowerCase();
      const base = path.basename(file);
      if (['.ts', '.js', '.mjs', '.svelte'].includes(ext)) {
        const source = fs.readFileSync(file, 'utf8');
        const { specifiers, problems } = extractImports(source);
        for (const p of problems) fail(id, `${rel}: ${p}`);
        const ctx = { file, gameDir, root, isManifest: rel === 'manifest.ts', isTest: isTestFile(file) };
        for (const spec of specifiers) {
          const v = importViolation(spec, ctx);
          if (v) fail(id, `${rel}: ${v}`);
        }
        if (new RegExp(`['"\`]/[^'"\`\\s]*(${ASSET_EXTS.map((e) => e.slice(1)).join('|')})['"\`]`).test(source))
          fail(id, `${rel}: absolute asset path; import assets from ./assets/ instead`);
      } else if (ext === '.css') {
        for (const sel of badCssSelectors(fs.readFileSync(file, 'utf8'), id))
          fail(id, `${rel}: selector "${sel}" must start with [data-game="${id}"]`);
      } else if (!IGNORED_FILES.has(base)) {
        const size = fs.statSync(file).size;
        if (!ASSET_EXTS.includes(ext)) fail(id, `${rel}: file type "${ext || base}" is not allowed (assets: ${ASSET_EXTS.join(' ')})`);
        if (size > ASSET_FILE_MAX) fail(id, `${rel}: ${size} bytes exceeds the ${ASSET_FILE_MAX} byte per-file limit`);
        assetTotal += size;
      }
    }
    if (assetTotal > ASSET_TOTAL_MAX) fail(id, `assets total ${assetTotal} bytes exceeds ${ASSET_TOTAL_MAX}`);
    else if (assetTotal > ASSET_TOTAL_WARN) warnings.push(`${id}: assets total ${assetTotal} bytes exceeds the ${ASSET_TOTAL_WARN} byte warning level`);
  }
  return { errors, warnings, checked: dirs };
}
