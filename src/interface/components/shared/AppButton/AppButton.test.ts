import { enableAutoUnmount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import FixtureFactory from '@/globals/FixtureFactory.ts';
import AppButton from '@/interface/components/shared/AppButton/AppButton.vue';
import { Accent, Key } from '@/interface/enums.ts';
import DialogStore from '@/interface/stores/DialogStore/DialogStore.ts';

enableAutoUnmount(afterEach);

const fixtures = FixtureFactory.createForComponent({
  component: AppButton,
  props: {
    accent: [Accent.Primary, Accent.Secondary],
    isDisabled: [false, true],
    keys: [[], [Key.Enter], [Key.Enter, Key.Space]],
  },
  slot: ['Go', null],
});

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

    test('renders button', () => {
      const wrapper = mountInstance();
      expect(wrapper.find('button').exists()).toBe(true);
    });

    if (isDisabled) {
      test('is disabled', () => {
        const wrapper = mountInstance();
        expect(wrapper.attributes('disabled')).toBeDefined();
      });

      test('is not focusable', () => {
        const wrapper = mountInstance({ attachTo: document.body });
        (wrapper.element as HTMLButtonElement).focus();
        expect(document.activeElement).not.toBe(wrapper.element);
      });

      test('does not emit trigger on click', async () => {
        const wrapper = mountInstance();
        await wrapper.trigger('click');
        expect(wrapper.emitted('trigger')).toBeUndefined();
      });
    }

    if (!isDisabled) {
      test('is not disabled', () => {
        const wrapper = mountInstance();
        expect(wrapper.attributes('disabled')).toBeUndefined();
      });

      test('is focusable', () => {
        const wrapper = mountInstance({ attachTo: document.body });
        document.body.focus();
        expect(document.activeElement).not.toBe(wrapper.element);
        (wrapper.element as HTMLButtonElement).focus();
        expect(document.activeElement).toBe(wrapper.element);
      });

      test('exposes focus', () => {
        const wrapper = mountInstance();
        expect((wrapper.vm as { focus?: unknown }).focus).toBeInstanceOf(Function);
      });

      test('emits trigger on click', async () => {
        const wrapper = mountInstance();
        await wrapper.trigger('click');
        expect(wrapper.emitted('trigger')).toBeDefined();
      });

      test('does not emit trigger on click while dialog is open', async () => {
        const wrapper = mountInstance();
        void DialogStore.INSTANCE().trigger({ cancelText: 'No', confirmText: 'Yes', html: '<p />' });
        await wrapper.trigger('click');
        expect(wrapper.emitted('trigger')).toBeUndefined();
      });
    }

    if (hasKeys) {
      test('attaches window keydown listener on mount', () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        mountInstance();
        const keydownAdds = addSpy.mock.calls.filter(([eventName]) => eventName === 'keydown');
        expect(keydownAdds).toEqual([['keydown', expect.any(Function), true]]);
      });

      test('removes attached window keydown listener on unmount', () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        const removeSpy = vi.spyOn(window, 'removeEventListener');
        const wrapper = mountInstance();
        const addHandler = addSpy.mock.calls.find(([eventName]) => eventName === 'keydown')?.[1];
        expect(addHandler).toBeDefined();
        wrapper.unmount();
        const keydownRemoves = removeSpy.mock.calls.filter(
          ([eventName, callHandler]) => eventName === 'keydown' && callHandler === addHandler,
        );
        expect(keydownRemoves).toEqual([['keydown', addHandler, true]]);
      });

      describe.each(keys)('for key "%s"', key => {
        test('does not emit trigger on keydown while dialog is open', () => {
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
            expect(wrapper.emitted('trigger')).toBeDefined();
          });
      });
    }

    if (!hasKeys) {
      test('does not attach window keydown listener on mount', () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        mountInstance();
        const keydownAdds = addSpy.mock.calls.filter(([eventName]) => eventName === 'keydown');
        expect(keydownAdds).toEqual([]);
      });
    }
  });
});
