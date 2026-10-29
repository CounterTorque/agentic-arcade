import { ID_RE } from './games.mjs';

/** @param {string} branch @param {string[]} files @returns {{ games: string, error?: string }} */
export function evaluateScope(branch, files) {
  const game = /^game\/([^/]+)(?:\/.+)?$/.exec(branch);
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
  // Forge branches: infer game ID from changed files
  if (/^forge\//.test(branch)) {
    const gameFiles = files.filter((f) => f.startsWith('src/games/'));
    if (gameFiles.length === 0) {
      return { games: '', error: `branch ${branch} changes no game files` };
    }
    const gameIds = new Set(gameFiles.map((f) => f.split('/')[2]));
    if (gameIds.size > 1) {
      return {
        games: '',
        error: `branch ${branch} changes multiple games: ${[...gameIds].join(', ')}. Each PR must touch only one game.`,
      };
    }
    const id = [...gameIds][0];
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
    error: `branch "${branch}" must be named game/<id>[/<topic>], framework/<topic>, docs/<topic>, ci/<topic>, deps/<topic>, or forge/<id>. See AGENTS.md.`,
  };
}
