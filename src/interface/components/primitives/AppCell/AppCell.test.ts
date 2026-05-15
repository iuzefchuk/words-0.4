import { enableAutoUnmount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import fixtures from '@/interface/components/primitives/AppCell/AppCell.fixtures.ts';

enableAutoUnmount(afterEach);

describe('AppCell', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe.each(fixtures)('for $desc', fixture => {
    const {
      mountInstance,
      props: { bonus, colIndex, isFocused, label, role, rowIndex },
      slot,
    } = fixture;

    test('mounts', async () => {
      await mountInstance();
    });

    if (slot !== null) {
      test('renders slot', async () => {
        const wrapper = await mountInstance();
        expect(wrapper.text()).toContain(slot);
      });
    }

    test('renders button', async () => {
      const wrapper = await mountInstance();
      expect(wrapper.find('button').exists()).toBe(true);
    });

    test('sets button role', async () => {
      const wrapper = await mountInstance();
      expect(wrapper.find('button').attributes('role')).toBe(role);
    });

    test('sets button aria-rowindex', async () => {
      const wrapper = await mountInstance();
      expect(wrapper.find('button').attributes('aria-rowindex')).toBe(String(rowIndex));
    });

    test('sets button aria-colindex', async () => {
      const wrapper = await mountInstance();
      expect(wrapper.find('button').attributes('aria-colindex')).toBe(String(colIndex));
    });

    test('sets button aria-label', async () => {
      const wrapper = await mountInstance();
      expect(wrapper.find('button').attributes('aria-label')).toBe(label);
    });

    test('sets button tabindex according to focus', async () => {
      const wrapper = await mountInstance();
      expect(wrapper.find('button').attributes('tabindex')).toBe(isFocused ? '0' : '-1');
    });

    if (bonus !== null) {
      test('renders svg inside button', async () => {
        const wrapper = await mountInstance();
        expect(wrapper.find('button svg').exists()).toBe(true);
      });

      test('renders text in svg inside button', async () => {
        const wrapper = await mountInstance();
        const svgText = wrapper.find('button svg text');
        expect(svgText.exists()).toBe(true);
        expect(svgText.text().length).toBeGreaterThan(0);
      });
    }

    test('emits activate on click and stops propagation', async () => {
      const wrapper = await mountInstance({ attachTo: document.body });
      const parentListener = vi.fn();
      document.body.addEventListener('click', parentListener);
      await wrapper.trigger('click');
      document.body.removeEventListener('click', parentListener);
      expect(wrapper.emitted('activate')).toBeDefined();
      expect(parentListener).not.toHaveBeenCalled();
    });

    test('emits activate on Enter keydown, prevents default and stops propagation', async () => {
      const wrapper = await mountInstance({ attachTo: document.body });
      const parentListener = vi.fn();
      document.body.addEventListener('keydown', parentListener);
      const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' });
      wrapper.find('button').element.dispatchEvent(event);
      document.body.removeEventListener('keydown', parentListener);
      expect(wrapper.emitted('activate')).toBeDefined();
      expect(event.defaultPrevented).toBe(true);
      expect(parentListener).not.toHaveBeenCalled();
    });

    test('emits doubleActivate on dblclick and stops propagation', async () => {
      const wrapper = await mountInstance({ attachTo: document.body });
      const parentListener = vi.fn();
      document.body.addEventListener('dblclick', parentListener);
      await wrapper.trigger('dblclick');
      document.body.removeEventListener('dblclick', parentListener);
      expect(wrapper.emitted('doubleActivate')).toBeDefined();
      expect(parentListener).not.toHaveBeenCalled();
    });
  });
});
