import { enableAutoUnmount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import fixtures from '@/interface/components/shared/AppButton/fixtures.ts';
import DialogStore from '@/interface/stores/DialogStore/DialogStore.ts';

enableAutoUnmount(afterEach);

describe('AppButton', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe.each(fixtures)('for $desc', fixture => {
    const {
      mountInstance,
      props: { isDisabled, keys },
      slot,
    } = fixture;
    const hasKeys = keys.length > 0;

    test('mounts', () => {
      expect(() => mountInstance()).not.toThrow();
    });

    test('renders slot', () => {
      const wrapper = mountInstance();
      expect(wrapper.text()).toBe(slot ?? '');
    });

    test('renders button element', () => {
      const wrapper = mountInstance();
      expect(wrapper.find('button').exists()).toBe(true);
    });

    test('does not emit trigger on click while a dialog is open', async () => {
      const wrapper = mountInstance();
      void DialogStore.INSTANCE().trigger({ cancelText: 'No', confirmText: 'Yes', html: '<p />' });
      await wrapper.trigger('click');
      expect(wrapper.emitted('trigger')).toBeUndefined();
    });

    if (hasKeys)
      test('attaches window keydown listener on mount', () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        mountInstance();
        const keydownAdds = addSpy.mock.calls.filter(([eventName]) => eventName === 'keydown');
        expect(keydownAdds).toHaveLength(1);
        expect(keydownAdds[0]).toEqual(['keydown', expect.any(Function), true]);
      });

    if (hasKeys)
      test('removes window keydown listener on unmount', () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        const removeSpy = vi.spyOn(window, 'removeEventListener');
        const wrapper = mountInstance();
        const addCall = addSpy.mock.calls.find(([eventName]) => eventName === 'keydown');
        expect(addCall).toBeDefined();
        const handler = addCall?.[1] as EventListener;
        wrapper.unmount();
        expect(removeSpy).toHaveBeenCalledWith('keydown', handler, true);
      });

    if (!hasKeys)
      test('does not attach window keydown listener on mount', () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        mountInstance();
        const keydownAdds = addSpy.mock.calls.filter(([eventName]) => eventName === 'keydown');
        expect(keydownAdds).toEqual([]);
      });

    if (isDisabled)
      test('sets disabled attribute on button element', () => {
        const wrapper = mountInstance();
        expect(wrapper.attributes('disabled')).toBeDefined();
      });

    if (isDisabled)
      test('is not focusable', () => {
        const wrapper = mountInstance({ attachTo: document.body });
        (wrapper.vm as unknown as { focus: () => void }).focus();
        expect(document.activeElement).not.toBe(wrapper.element);
      });

    if (isDisabled)
      test('does not emit trigger on click', async () => {
        const wrapper = mountInstance();
        await wrapper.trigger('click');
        expect(wrapper.emitted('trigger')).toBeUndefined();
      });

    if (!isDisabled)
      test('does not set disabled attribute on button element', () => {
        const wrapper = mountInstance();
        expect(wrapper.attributes('disabled')).toBeUndefined();
      });

    if (!isDisabled)
      test('is focusable', () => {
        const wrapper = mountInstance({ attachTo: document.body });
        (wrapper.vm as unknown as { focus: () => void }).focus();
        expect(document.activeElement).toBe(wrapper.element);
      });

    if (!isDisabled)
      test('emits trigger on click', async () => {
        const wrapper = mountInstance();
        await wrapper.trigger('click');
        expect(wrapper.emitted('trigger')).toHaveLength(1);
      });

    if (hasKeys)
      describe.each(keys)('for key "%s"', key => {
        test('does not emit trigger on keydown while a dialog is open', () => {
          const wrapper = mountInstance();
          void DialogStore.INSTANCE().trigger({ cancelText: 'No', confirmText: 'Yes', html: '<p />' });
          window.dispatchEvent(new KeyboardEvent('keydown', { key }));
          expect(wrapper.emitted('trigger')).toBeUndefined();
        });

        if (isDisabled)
          test('does not emit trigger on keydown', () => {
            const wrapper = mountInstance();
            window.dispatchEvent(new KeyboardEvent('keydown', { key }));
            expect(wrapper.emitted('trigger')).toBeUndefined();
          });

        if (!isDisabled)
          test('emits trigger on keydown', () => {
            const wrapper = mountInstance();
            window.dispatchEvent(new KeyboardEvent('keydown', { key }));
            expect(wrapper.emitted('trigger')).toHaveLength(1);
          });
      });
  });
});
