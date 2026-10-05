import { defineGame } from '@arcade/sdk';

export default defineGame({
  contractVersion: 1,
  create() {
    return { tick() {} };
  },
});
