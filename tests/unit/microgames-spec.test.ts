import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONTROL_HINT_RE, VERB_RE } from '../../src/framework/manifest-schema';

const root = path.resolve(__dirname, '../..');
const ID_RE = /^[a-z][a-z0-9-]{1,30}$/;
const CONTROLS = ['action', 'directions', 'pointer'];

interface Spec {
  id: string;
  title: string;
  fields: Record<string, string>;
  controls: string[];
  levels: Record<string, string>;
}

function parseSpecs(markdown: string): Spec[] {
  const specs: Spec[] = [];
  const re = /^### \d+\. (.+)\n[\s\S]*?```yaml\n([\s\S]*?)```/gm;
  for (const m of markdown.matchAll(re)) {
    const fields: Record<string, string> = {};
    const levels: Record<string, string> = {};
    let inLevels = false;
    let controls: string[] = [];
    for (const line of m[2]!.split('\n')) {
      const level = /^ {2}(\d+): "(.*)"$/.exec(line);
      if (inLevels && level) {
        levels[level[1]!] = level[2]!;
        continue;
      }
      const kv = /^(\w+):\s*(.*)$/.exec(line);
      if (!kv) continue;
      inLevels = kv[1] === 'levels';
      if (kv[1] === 'controls') {
        controls = kv[2]!.replace(/^\[|\]$/g, '').split(',').map((s) => s.trim()).filter(Boolean);
        continue;
      }
      const raw = kv[2]!;
      fields[kv[1]!] = raw.startsWith('"') ? raw.slice(1, -1) : raw;
    }
    specs.push({ id: fields.id ?? `(no id: ${m[1]})`, title: m[1]!.trim(), fields, controls, levels });
  }
  return specs;
}

const specs = parseSpecs(fs.readFileSync(path.join(root, 'microgames.md'), 'utf8'));
const gamesDir = path.join(root, 'src', 'games');
const existing = new Set(fs.existsSync(gamesDir) ? fs.readdirSync(gamesDir) : []);

describe('microgames.md specs', () => {
  it('has exactly 50 specs', () => {
    expect(specs).toHaveLength(50);
  });

  it('has unique ids and titles', () => {
    const dupes = (values: string[]) => values.filter((v, i) => values.indexOf(v) !== i);
    expect(dupes(specs.map((s) => s.id))).toEqual([]);
    expect(dupes(specs.map((s) => s.title.toLowerCase()))).toEqual([]);
  });

  for (const s of specs) {
    describe(s.id, () => {
      const f = s.fields;
      it('has a valid id and title', () => {
        expect(s.id, `${s.id}: id format`).toMatch(ID_RE);
        expect(existing.has(s.id), `${s.id}: id collides with an existing src/games directory`).toBe(false);
        expect(s.title.length, `${s.id}: title length`).toBeGreaterThanOrEqual(1);
        expect(s.title.length, `${s.id}: title "${s.title}" is longer than 24`).toBeLessThanOrEqual(24);
      });

      it('has a valid prompt and duration', () => {
        expect(f.prompt, `${s.id}: prompt must match ${VERB_RE}`).toMatch(VERB_RE);
        const seconds = Number(f.duration_s);
        expect(Number.isInteger(seconds) && seconds >= 3 && seconds <= 8, `${s.id}: duration_s must be an integer 3-8 (got ${f.duration_s})`).toBe(true);
      });

      it('has valid controls and control_hint', () => {
        expect(s.controls.length, `${s.id}: controls must be non-empty`).toBeGreaterThan(0);
        expect(s.controls.every((c) => CONTROLS.includes(c)), `${s.id}: controls must be a subset of ${CONTROLS.join(', ')}`).toBe(true);
        expect(new Set(s.controls).size, `${s.id}: controls must not repeat`).toBe(s.controls.length);
        expect(f.control_hint ?? '', `${s.id}: control_hint format`).toMatch(CONTROL_HINT_RE);
        expect((f.control_hint ?? '').length, `${s.id}: control_hint longer than 48`).toBeLessThanOrEqual(48);
      });

      it('has an outcome, win/lose text and levels 1-3', () => {
        expect(['win', 'lose'], `${s.id}: outcome_on_timeout`).toContain(f.outcome_on_timeout);
        expect((f.win ?? '').trim(), `${s.id}: win must be non-empty`).not.toBe('');
        expect((f.lose ?? '').trim(), `${s.id}: lose must be non-empty`).not.toBe('');
        expect(Object.keys(s.levels).sort(), `${s.id}: levels must be exactly 1, 2, 3`).toEqual(['1', '2', '3']);
        for (const [k, v] of Object.entries(s.levels)) expect(v.trim(), `${s.id}: level ${k} text`).not.toBe('');
      });
    });
  }
});
