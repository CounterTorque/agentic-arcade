import { ID_RE } from './games.mjs';

/** @param {string} branch @param {string[]} files @returns {{ games: string, error?: string }} */
export function evaluateScope(branch, files) {
  const game = /^game\/(.+)$/.exec(branch);
  if (game) {
    const id = game[1];
    if (!ID_RE.test(id)) return { games: '', error: `invalid game id "${id}" in branch "${branch}"` };
    const prefix = `src/games/${id}/`;
    const outside = files.filter((f) => !f.startsWith(prefix));
    if (outside.length)
      return {
        games: '',
        error: `branch ${branch} may only change files under ${prefix}; also changed:\n  ${outside.join('\n  ')}\nSee AGENTS.md section 1.`,
      };
    return { games: id };
  }
  if (/^(framework|docs|ci|deps)\/.+/.test(branch)) return { games: '' };
  return {
    games: '',
    error: `branch "${branch}" must be named game/<id>, framework/<topic>, docs/<topic>, ci/<topic>, or deps/<topic>. See AGENTS.md.`,
  };
}
