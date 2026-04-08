/* eslint-disable */
import 'vitest';

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeRisingWithStep(step: number): T;
  }
}
