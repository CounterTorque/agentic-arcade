import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { MicroGame } from '@arcade/sdk';
import { checkGame } from '../helpers/contract';
import { gameFiles, checkBudget, sharedKeys } from '../../scripts/lib/budget.mjs';
import { badCssSelectors, checkGames, extractImports, importViolation } from '../../scripts/lib/games.mjs';
import { evaluateScope } from '../../scripts/lib/pr-scope.mjs';
import { scaffoldGame, titleFromId } from '../../scripts/lib/scaffold.mjs';
import type { GameManifest } from '@arcade/sdk';

const repo = path.resolve(__dirname, '../..');

describe('evaluateScope', () => {
  it('accepts a game branch touching only its directory', () => {
    expect(evaluateScope('game/my-game', ['src/games/my-game/index.ts', 'src/games/my-game/a/b.png'])).toEqual({ games: 'my-game' });
  });

  it('rejects files outside the game directory, including look-alike prefixes', () => {
    for (const f of ['package.json', 'src/games/other/index.ts', 'src/games/my-game-2/index.ts', 'docs/x.md']) {
      expect(evaluateScope('game/my-game', ['src/games/my-game/index.ts', f]).error).toContain(f);
    }
  });

  it('rejects invalid game ids', () => {
    expect(evaluateScope('game/Bad_Id', []).error).toBeTruthy();
  });

  it('has no path restriction on framework, docs, ci and deps branches', () => {
    for (const b of ['framework/x', 'docs/x', 'ci/x', 'deps/x']) expect(evaluateScope(b, ['package.json'])).toEqual({ games: '' });
  });

  it('rejects other branch names', () => {
    for (const b of ['main', 'feature/x', 'framework', 'game']) expect(evaluateScope(b, []).error).toContain('AGENTS.md');
  });
});

describe('import boundary logic', () => {
  const gameDir = path.join(repo, 'src/games/g-one');
  const ctx = (over = {}) => ({ file: path.join(gameDir, 'index.ts'), gameDir, root: repo, isManifest: false, isTest: false, ...over });

  it('extracts static, side-effect, re-export and dynamic imports and ignores comments', () => {
    const src = `
      import a from './a';
      import { b,
        c } from "svelte";
      import './side.css';
      export * from './re';
      const x = await import('./lazy');
      // import nope from 'nope';
      /* import nope2 from 'nope2'; */
    `;
    expect(extractImports(src).specifiers).toEqual(['./a', 'svelte', './side.css', './re', './lazy']);
  });

  it('flags computed dynamic imports and import.meta.glob', () => {
    expect(extractImports('import(name)').problems).toHaveLength(1);
    expect(extractImports("import.meta.glob('./*')").problems).toHaveLength(1);
  });

  it('allows sdk, svelte and in-directory relatives', () => {
    for (const s of ['@arcade/sdk', 'svelte', 'svelte/transition', './logic', './assets/x.png', '../g-one/logic']) {
      expect(importViolation(s, ctx())).toBeNull();
    }
  });

  it('rejects framework, other games, packages and escapes', () => {
    for (const s of ['../../framework/registry', '../other/index', '../../../app/App.svelte', 'lodash', 'vitest', '@playwright/test']) {
      expect(importViolation(s, ctx())).toBeTruthy();
    }
  });

  it('lets test files use tests/helpers and test runners only', () => {
    const t = ctx({ file: path.join(gameDir, 'a.test.ts'), isTest: true });
    expect(importViolation('../../../tests/helpers/fake-host', t)).toBeNull();
    expect(importViolation('vitest', t)).toBeNull();
    expect(importViolation('../../../tests/unit/x', t)).toBeTruthy();
    expect(importViolation('../../../tests/helpers/fake-host', ctx())).toBeTruthy();
  });

  it('restricts manifest.ts to @arcade/sdk', () => {
    const m = ctx({ isManifest: true });
    expect(importViolation('@arcade/sdk', m)).toBeNull();
    expect(importViolation('./other', m)).toBeTruthy();
    expect(importViolation('svelte', m)).toBeTruthy();
  });
});

describe('css selector prefix', () => {
  it('accepts prefixed selectors, including inside @media and keyframes', () => {
    const css = `
      /* c */
      [data-game="g"] .a, [data-game="g"] > .b:not(.c) { color: red; }
      @media (min-width: 1px) { [data-game="g"] .d { top: 0 } }
      @keyframes spin { from { opacity: 0 } to { opacity: 1 } }
      @font-face { font-family: x; }
    `;
    expect(badCssSelectors(css, 'g')).toEqual([]);
  });

  it('reports unprefixed selectors', () => {
    expect(badCssSelectors('.a, [data-game="g"] .b { x: y } body { z: 1 } @media print { .c { a: b } }', 'g')).toEqual(['.a', 'body', '.c']);
    expect(badCssSelectors('[data-game="other"] .a { x: y }', 'g')).toEqual(['[data-game="other"] .a']);
  });
});

describe('budget logic', () => {
  const manifest = {
    'index.html': { file: 'assets/main.js', isEntry: true, imports: ['_shared.js'], css: ['assets/main.css'] },
    '_shared.js': { file: 'assets/shared.js' },
    'src/games/g/index.ts': { file: 'assets/g.js', imports: ['_shared.js', '_gonly.js'], css: ['assets/g.css'] },
    '_gonly.js': { file: 'assets/gonly.js', imports: ['_shared.js'] },
  };

  it('counts only game-owned chunks and css', () => {
    expect([...sharedKeys(manifest)].sort()).toEqual(['_shared.js', 'index.html']);
    expect(gameFiles(manifest, 'g').sort()).toEqual(['assets/g.css', 'assets/g.js', 'assets/gonly.js']);
  });

  it('applies hard and warning thresholds', () => {
    expect(checkBudget(manifest, () => 10 * 1024)).toMatchObject({ errors: [], warnings: [], sizes: { g: 30 * 1024 } });
    expect(checkBudget(manifest, () => 12 * 1024).warnings).toHaveLength(1);
    expect(checkBudget(manifest, () => 25 * 1024).errors).toHaveLength(1);
    expect(checkBudget(manifest, () => 1, 'missing').errors).toHaveLength(1);
    expect(checkBudget({ 'index.html': manifest['index.html'] }, () => 1)).toMatchObject({ errors: [], sizes: {} });
  });
});

describe('check-games and template', () => {
  const tmpRoots: string[] = [];
  afterEach(() => {
    for (const d of tmpRoots.splice(0)) fs.rmSync(d, { recursive: true, force: true });
  });

  const tmpRoot = () => {
    const dir = fs.mkdtempSync(path.join(repo, '.tmp-scaffold-'));
    tmpRoots.push(dir);
    fs.symlinkSync(path.join(repo, 'tests'), path.join(dir, 'tests'));
    fs.symlinkSync(path.join(repo, 'templates'), path.join(dir, 'templates'));
    fs.mkdirSync(path.join(dir, 'src', 'games'), { recursive: true });
    return dir;
  };

  it('passes with zero games', () => {
    expect(checkGames({ root: tmpRoot() })).toMatchObject({ errors: [], checked: [] });
  });

  it('derives titles from ids', () => {
    expect(titleFromId('my-cool-game')).toBe('My Cool Game');
  });

  it('rejects bad ids and existing directories when scaffolding', () => {
    const root = tmpRoot();
    expect(() => scaffoldGame({ root, id: 'Bad' })).toThrow();
    scaffoldGame({ root, id: 'ok-game' });
    expect(() => scaffoldGame({ root, id: 'ok-game' })).toThrow(/already exists/);
    expect(() => scaffoldGame({ root, id: 'other-game', verb: 'lower' })).toThrow();
    expect(() => scaffoldGame({ root, id: 'other-game', controls: 'Arrows' })).toThrow(/controls must be/);
    expect(fs.existsSync(path.join(root, 'src', 'games', 'other-game'))).toBe(false);
  });

  it('scaffolds a game that passes check-games and the contract suite', async () => {
    const root = tmpRoot();
    const dir = scaffoldGame({ root, id: 'tpl-probe', title: 'Tpl Probe', verb: 'TAP!', controls: 'Arrows (Move)' });
    const manifestSource = fs.readFileSync(path.join(dir, 'manifest.ts'), 'utf8');
    expect(manifestSource).toContain("id: 'tpl-probe'");
    expect(manifestSource).toContain("controlHint: 'Arrows (Move)'");
    expect(manifestSource).not.toContain('__');
    expect(fs.existsSync(path.join(dir, 'assets', '.gitkeep'))).toBe(true);
    expect(checkGames({ root, only: 'tpl-probe' })).toMatchObject({ errors: [], checked: ['tpl-probe'] });

    const { manifest } = (await import(/* @vite-ignore */ path.join(dir, 'manifest.ts'))) as { manifest: GameManifest };
    const mod = (await import(/* @vite-ignore */ path.join(dir, 'index.ts'))) as { default: MicroGame<unknown> };
    const report = await checkGame({ id: manifest.id, manifest, load: async () => mod.default });
    expect(report.failures).toEqual([]);
  });

  it('reports structural, boundary, css and asset problems', () => {
    const root = tmpRoot();
    const dir = path.join(root, 'src', 'games', 'bad-game');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'manifest.ts'), "import { x } from './other';\n");
    fs.writeFileSync(path.join(dir, 'index.ts'), "import { y } from '../../framework/registry';\nimport z from 'lodash';\n");
    fs.writeFileSync(path.join(dir, 'style.css'), '.a { color: red }');
    fs.writeFileSync(path.join(dir, 'sound.mp3'), 'x');
    fs.writeFileSync(path.join(dir, 'big.png'), Buffer.alloc(600 * 1024));
    const { errors } = checkGames({ root });
    const text = errors.join('\n');
    for (const needle of ['missing required file README.md', '*.test.ts', "manifest.ts may import only", 'framework/registry', 'lodash', 'must start with', '.mp3', 'per-file limit'])
      expect(text).toContain(needle);
    expect(checkGames({ root, only: 'nope' }).errors).toHaveLength(1);
  });
});
