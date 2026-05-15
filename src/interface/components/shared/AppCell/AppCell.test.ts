import { enableAutoUnmount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, test } from 'vitest';
import fixtures from '@/interface/components/shared/AppCell/AppCell.fixtures.ts';

enableAutoUnmount(afterEach);

describe('AppCell', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe.each(fixtures)('for $desc', fixture => {
    const {
      props: { bonus },
    } = fixture;

    test('mounts', () => {
      // TODO
    });

    test('renders slot', () => {
      // TODO
    });

    test('renders button', () => {
      // TODO
    });

    test('sets role', () => {
      // TODO
    });

    test('sets aria-rowindex', () => {
      // TODO
    });

    test('sets aria-colindex', () => {
      // TODO
    });

    test('sets aria-label', () => {
      // TODO
    });

    test('sets tabindex according to focus', () => {
      // TODO
    });

    if (bonus !== null) {
      test('renders svg inside button', () => {
        // TODO
      });

      test('renders svg inside button with text', () => {
        // TODO
      });
    }

    test('emits activate on click and stops propagation', () => {
      // TODO
    });

    test('emits activate on Enter keydown, prevents default and stops propagation', () => {
      // TODO
    });

    test('emits doubleActivate on dblclick and stops propagation', () => {
      // TODO
    });
  });
});
