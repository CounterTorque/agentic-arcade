import js from '@eslint/js';
import globals from 'globals';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

const gameFiles = ['src/games/**/*.{ts,js,svelte}'];
const gameTestFiles = ['src/games/**/*.test.ts', 'src/games/**/*.e2e.ts'];

export default tseslint.config(
  { ignores: ['dist', 'playwright-report', 'test-results', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    files: gameFiles,
    rules: {
      'no-restricted-globals': [
        'error',
        ...[
          'localStorage',
          'sessionStorage',
          'indexedDB',
          'fetch',
          'XMLHttpRequest',
          'WebSocket',
          'requestAnimationFrame',
          'setTimeout',
          'setInterval',
          'history',
          'location',
        ].map((name) => ({ name, message: 'Forbidden in games. See AGENTS.md section 6.' })),
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use ctx.rng.' },
        { object: 'Date', property: 'now', message: 'Use frame.dt / frame.elapsed.' },
        { object: 'performance', property: 'now', message: 'Use frame.dt / frame.elapsed.' },
        ...['window', 'document'].flatMap((object) =>
          ['addEventListener', 'removeEventListener'].map((property) => ({
            object,
            property,
            message: 'Add listeners inside ctx.root with { signal: ctx.signal }.',
          })),
        ),
        { object: 'document', property: 'cookie', message: 'Forbidden in games.' },
        { object: 'document', property: 'title', message: 'Forbidden in games.' },
      ],
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/framework/**', '**/app/**'],
              message: 'Games may import only @arcade/sdk, svelte, and files in their own directory.',
            },
          ],
        },
      ],
    },
  },
  {
    files: gameTestFiles,
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-properties': 'off',
    },
  },
);
