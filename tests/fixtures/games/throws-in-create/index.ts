import { defineGame } from '@arcade/sdk';

export default defineGame({
  contractVersion: 1,
  create() {
    throw new Error('boom');
  },
});
