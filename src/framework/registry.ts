import type { GameManifest, MicroGame } from '@arcade/sdk';
import { validateManifest } from './manifest-schema';

type Loader = () => Promise<MicroGame<unknown>>;

// Glob arguments must be string literals: Vite resolves them statically at build time.
const manifestModules = import.meta.glob<GameManifest>('/src/games/*/manifest.ts', {
  eager: true,
  import: 'manifest',
});
const gameLoaders = import.meta.glob<MicroGame<unknown>>('/src/games/*/index.ts', {
  import: 'default',
});

export interface RegistryEntry {
  id: string;
  manifest: GameManifest;
  load: Loader;
}
export interface RegistryProblem {
  dir: string;
  errors: string[];
}

const dirOf = (path: string) => path.split('/').at(-2)!;

export function buildRegistry(
  manifests: Record<string, GameManifest>,
  loaders: Record<string, Loader>,
): { entries: RegistryEntry[]; problems: RegistryProblem[] } {
  const loaderByDir = new Map(Object.entries(loaders).map(([p, l]) => [dirOf(p), l]));
  const entries: RegistryEntry[] = [];
  const problems: RegistryProblem[] = [];
  for (const [path, manifest] of Object.entries(manifests)) {
    const dir = dirOf(path);
    const errors = validateManifest(manifest, dir);
    const load = loaderByDir.get(dir);
    if (!load) errors.push('missing index.ts');
    if (errors.length) problems.push({ dir, errors });
    else entries.push({ id: dir, manifest, load: load! });
  }
  for (const dir of loaderByDir.keys())
    if (!entries.some((e) => e.id === dir) && !problems.some((p) => p.dir === dir))
      problems.push({ dir, errors: ['missing manifest.ts'] });
  entries.sort((a, b) => a.manifest.title.localeCompare(b.manifest.title));
  return { entries, problems };
}

export const registry = buildRegistry(manifestModules, gameLoaders);
if (import.meta.env.DEV && registry.problems.length) console.error('[arcade] invalid games', registry.problems);
