import { enableAutoUnmount } from '@vue/test-utils';
import { afterEach, describe, expect, test } from 'vitest';
import fixtures from '@/interface/components/primitives/AppTile/AppTile.fixtures.ts';

enableAutoUnmount(afterEach);

describe('AppTile', () => {
  describe.each(fixtures)('for $desc', fixture => {
    const {
      mountInstance,
      props: { letter },
    } = fixture;

    test('mounts', async () => {
      await mountInstance();
    });

    test('renders svg element', async () => {
      const wrapper = await mountInstance();
      expect(wrapper.find('svg').exists()).toBe(true);
    });

    test('renders letter in svg text', async () => {
      const wrapper = await mountInstance();
      const texts = wrapper.findAll('svg text').map(node => node.text());
      expect(texts).toContain(letter);
    });

    test('renders points in svg text', async () => {
      const wrapper = await mountInstance();
      const numbers = wrapper
        .findAll('svg text')
        .map(node => Number(node.text()))
        .filter(value => !Number.isNaN(value));
      expect(numbers.some(value => value > 0)).toBe(true);
    });
  });
});
