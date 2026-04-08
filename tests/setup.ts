import { expect } from 'vitest';

expect.extend({
  toBeRisingWithStep(received, step) {
    const pass = Array.isArray(received) && received.every((v, i, arr) => i === 0 || v - arr[i - 1] === step);
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be rising with step ${step}`,
      pass,
    };
  },
});
