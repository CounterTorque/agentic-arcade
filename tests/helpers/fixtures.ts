import type { GameManifest, MicroGame } from '@arcade/sdk';
import { buildRegistry, type RegistryEntry } from '../../src/framework/registry';

const manifests = import.meta.glob<GameManifest>('/tests/fixtures/games/*/manifest.ts', { eager: true, import: 'manifest' });
const loaders = import.meta.glob<MicroGame<unknown>>('/tests/fixtures/games/*/index.ts', { import: 'default' });

export const fixtureRegistry = buildRegistry(manifests, loaders);

export function fixture(name: string): RegistryEntry {
  const entry = fixtureRegistry.entries.find((e) => e.id === name);
  if (!entry) throw new Error(`unknown fixture: ${name}`);
  return entry;
}

export function makeEntry(
  game: MicroGame<unknown>,
  overrides: Partial<GameManifest> = {},
): RegistryEntry {
  const id = overrides.id ?? 'inline-game';
  return {
    id,
    manifest: {
      contractVersion: 1,
      id,
      title: 'Inline',
      verb: 'GO!',
      description: 'Inline test game.',
      author: 'tests',
      controls: ['action'],
      baseDurationMs: 3000,
      outcomeOnTimeout: 'win',
      ...overrides,
    },
    load: async () => game,
  };
}
