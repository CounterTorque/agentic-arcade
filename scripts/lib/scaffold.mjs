import fs from 'node:fs';
import path from 'node:path';
import { CONTROL_HINT_RE, ID_RE, VERB_RE } from './games.mjs';

export const titleFromId = (id) =>
  id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/** @param {{ root: string, id: string, title?: string, verb?: string, controls?: string }} o @returns {string} created directory */
export function scaffoldGame({ root, id, title, verb = 'PRESS!', controls = 'Space/Click (Press)' }) {
  title ??= titleFromId(id);
  if (!ID_RE.test(id)) throw new Error(`id must match ${ID_RE}`);
  if (!VERB_RE.test(verb)) throw new Error(`verb must match ${VERB_RE}`);
  if (controls.length > 48 || !CONTROL_HINT_RE.test(controls))
    throw new Error(`controls must be 1-48 chars: keys/buttons then the action in parentheses, e.g. 'Space/Click (Jump)' or 'Arrows (Move), Space (Fire)'`);
  if (title.length < 1 || title.length > 24) throw new Error('title must be 1-24 characters');
  const target = path.join(root, 'src', 'games', id);
  if (fs.existsSync(target)) throw new Error(`src/games/${id} already exists`);
  const copy = (from, to) => {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
      const src = path.join(from, entry.name);
      const dst = path.join(to, entry.name);
      if (entry.isDirectory()) copy(src, dst);
      else {
        const text = fs.readFileSync(src, 'utf8');
        fs.writeFileSync(
          dst,
          text
            .replaceAll('__ID__', id)
            .replaceAll('__TITLE__', title)
            .replaceAll('__VERB__', verb)
            .replaceAll('__CONTROL_HINT__', controls),
        );
      }
    }
  };
  copy(path.join(root, 'templates', 'game'), target);
  return target;
}
