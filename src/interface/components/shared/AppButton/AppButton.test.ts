import { enableAutoUnmount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import fixtures from '@/interface/components/shared/AppButton/AppButton.fixtures.ts';
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

    test('mounts', async () => {
      await mountInstance();
    });

    test('renders slot', async () => {
      const wrapper = await mountInstance();
      expect(wrapper.text()).toBe(slot ?? '');
    });

    test('renders button', async () => {
      const wrapper = await mountInstance();
      expect(wrapper.find('button').exists()).toBe(true);
    });

    if (isDisabled) {
      test('is disabled', async () => {
        const wrapper = await mountInstance();
        expect(wrapper.attributes('disabled')).toBeDefined();
      });

      test('is not focusable', async () => {
        const wrapper = await mountInstance({ attachTo: document.body });
        (wrapper.element as HTMLButtonElement).focus();
        expect(document.activeElement).not.toBe(wrapper.element);
      });

      test('does not emit trigger on click', async () => {
        const wrapper = await mountInstance();
        await wrapper.trigger('click');
        expect(wrapper.emitted('trigger')).toBeUndefined();
      });
    }

    if (!isDisabled) {
      test('is not disabled', async () => {
        const wrapper = await mountInstance();
        expect(wrapper.attributes('disabled')).toBeUndefined();
      });

      test('is focusable', async () => {
        const wrapper = await mountInstance({ attachTo: document.body });
        document.body.focus();
        expect(document.activeElement).not.toBe(wrapper.element);
        (wrapper.element as HTMLButtonElement).focus();
        expect(document.activeElement).toBe(wrapper.element);
      });

      test('exposes focus', async () => {
        const wrapper = await mountInstance();
        expect((wrapper.vm as { focus?: unknown }).focus).toBeInstanceOf(Function);
      });

      test('emits trigger on click', async () => {
        const wrapper = await mountInstance();
        await wrapper.trigger('click');
        expect(wrapper.emitted('trigger')).toBeDefined();
      });

      test('does not emit trigger on click while dialog is open', async () => {
        const wrapper = await mountInstance();
        void DialogStore.INSTANCE().trigger({ cancelText: 'No', confirmText: 'Yes', html: '<p />' });
        await wrapper.trigger('click');
        expect(wrapper.emitted('trigger')).toBeUndefined();
      });
    }

    if (hasKeys) {
      test('attaches window keydown listener on mount', async () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        await mountInstance();
        const keydownAdds = addSpy.mock.calls.filter(([eventName]) => eventName === 'keydown');
        expect(keydownAdds).toEqual([['keydown', expect.any(Function), true]]);
      });

      test('removes attached window keydown listener on unmount', async () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        const removeSpy = vi.spyOn(window, 'removeEventListener');
        const wrapper = await mountInstance();
        const addHandler = addSpy.mock.calls.find(([eventName]) => eventName === 'keydown')?.[1];
        expect(addHandler).toBeDefined();
        wrapper.unmount();
        const keydownRemoves = removeSpy.mock.calls.filter(
          ([eventName, callHandler]) => eventName === 'keydown' && callHandler === addHandler,
        );
        expect(keydownRemoves).toEqual([['keydown', addHandler, true]]);
      });

      describe.each(keys)('for key "%s"', key => {
        test('does not emit trigger on keydown while dialog is open', async () => {
          const wrapper = await mountInstance();
          void DialogStore.INSTANCE().trigger({ cancelText: 'No', confirmText: 'Yes', html: '<p />' });
          window.dispatchEvent(new KeyboardEvent('keydown', { key }));
          expect(wrapper.emitted('trigger')).toBeUndefined();
        });

        if (isDisabled)
          test('does not emit trigger on keydown', async () => {
            const wrapper = await mountInstance();
            window.dispatchEvent(new KeyboardEvent('keydown', { key }));
            expect(wrapper.emitted('trigger')).toBeUndefined();
          });

        if (!isDisabled)
          test('emits trigger on keydown', async () => {
            const wrapper = await mountInstance();
            window.dispatchEvent(new KeyboardEvent('keydown', { key }));
            expect(wrapper.emitted('trigger')).toBeDefined();
          });
      });
    }

    if (!hasKeys) {
      test('does not attach window keydown listener on mount', async () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        await mountInstance();
        const keydownAdds = addSpy.mock.calls.filter(([eventName]) => eventName === 'keydown');
        expect(keydownAdds).toEqual([]);
      });
    }
  });
});
