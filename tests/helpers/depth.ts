export const TEST_DEPTH: 'smoke' | 'full' = process.env.TEST_DEPTH === 'full' ? 'full' : 'smoke';

export const depth = <T>(smoke: T, full: T): T => (TEST_DEPTH === 'full' ? full : smoke);
