import type { GameManifest } from '@arcade/sdk';

const ID_RE = /^[a-z][a-z0-9-]{1,30}$/;
const VERB_RE = /^[A-Z][A-Z !?]{0,11}$/;
const TAG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CONTROLS = ['action', 'directions', 'pointer'];

export function validateManifest(m: unknown, dir: string): string[] {
  if (typeof m !== 'object' || m === null) return ['manifest must be an object'];
  const o = m as Record<string, unknown>;
  const errors: string[] = [];
  const isStr = (v: unknown): v is string => typeof v === 'string';

  if (o.contractVersion !== 1) errors.push('contractVersion must be 1');
  if (!isStr(o.id) || !ID_RE.test(o.id)) errors.push(`id must match ${ID_RE}`);
  else if (o.id !== dir) errors.push(`id "${o.id}" must equal directory name "${dir}"`);
  if (!isStr(o.title) || o.title.length < 1 || o.title.length > 24) errors.push('title must be 1-24 characters');
  if (!isStr(o.verb) || !VERB_RE.test(o.verb)) errors.push(`verb must match ${VERB_RE}`);
  if (!isStr(o.description) || o.description.trim() === '' || o.description.length > 140)
    errors.push('description must be 1-140 characters');
  if (!isStr(o.author) || o.author.trim() === '') errors.push('author must be a non-empty string');
  if (!Array.isArray(o.controls) || o.controls.length === 0) errors.push('controls must be a non-empty array');
  else {
    if (o.controls.some((c) => !CONTROLS.includes(c))) errors.push(`controls must be a subset of ${CONTROLS.join(', ')}`);
    if (new Set(o.controls).size !== o.controls.length) errors.push('controls must not contain duplicates');
  }
  if (!Number.isInteger(o.baseDurationMs) || (o.baseDurationMs as number) < 3000 || (o.baseDurationMs as number) > 8000)
    errors.push('baseDurationMs must be an integer in [3000, 8000]');
  if (o.outcomeOnTimeout !== 'win' && o.outcomeOnTimeout !== 'lose') errors.push("outcomeOnTimeout must be 'win' or 'lose'");
  if (o.tags !== undefined) {
    if (!Array.isArray(o.tags) || o.tags.length > 5 || o.tags.some((t) => !isStr(t) || !TAG_RE.test(t)))
      errors.push('tags must be at most 5 kebab-case strings');
  }
  if (o.enabled !== undefined && typeof o.enabled !== 'boolean') errors.push('enabled must be a boolean');
  return errors;
}

export function findDuplicateTitles(manifests: readonly Pick<GameManifest, 'title'>[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const { title } of manifests) {
    const key = title.trim().toLowerCase();
    if (seen.has(key)) dupes.add(title);
    seen.add(key);
  }
  return [...dupes];
}
