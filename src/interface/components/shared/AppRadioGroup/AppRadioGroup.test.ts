import { enableAutoUnmount } from '@vue/test-utils';
import { afterEach, describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import fixtures from '@/interface/components/shared/AppRadioGroup/AppRadioGroup.fixtures.ts';

enableAutoUnmount(afterEach);

describe('AppRadioGroup', () => {
  describe.each(fixtures)('for $desc', fixture => {
    const {
      mountInstance,
      props: { legend, modelValue, options },
    } = fixture;
    const otherOption = options.find(option => option.value !== modelValue);

    test('mounts', async () => {
      await mountInstance();
    });

    test('renders fieldset with legend', async () => {
      const wrapper = await mountInstance();
      const fieldset = wrapper.find('fieldset');
      expect(fieldset.exists()).toBe(true);
      const legendEl = fieldset.find('legend');
      expect(legendEl.exists()).toBe(true);
      expect(legendEl.text()).toBe(legend);
    });

    test('renders one radio input per option', async () => {
      const wrapper = await mountInstance();
      expect(wrapper.findAll('input[type="radio"]')).toHaveLength(options.length);
    });

    test('renders one label per option', async () => {
      const wrapper = await mountInstance();
      expect(wrapper.findAll('label')).toHaveLength(options.length);
    });

    test('accepts only modelValue which matches one of the options values', async () => {
      const wrapper = await mountInstance();
      const checkedValues = wrapper
        .findAll('input[type="radio"]')
        .filter(input => (input.element as HTMLInputElement).checked)
        .map(input => (input.element as HTMLInputElement).value);
      expect(checkedValues).toEqual([modelValue]);
    });

    test('emits change with the option value when unselected radio is selected', async () => {
      if (otherOption === undefined) return;
      const wrapper = await mountInstance({ attachTo: document.body });
      const input = wrapper.find(`input[value="${otherOption.value}"]`);
      (input.element as HTMLInputElement).click();
      await nextTick();
      expect(wrapper.emitted('change')).toEqual([[otherOption.value]]);
    });

    test('does not emit change with the option value when selected radio is selected', async () => {
      const wrapper = await mountInstance({ attachTo: document.body });
      const input = wrapper.find(`input[value="${modelValue}"]`);
      (input.element as HTMLInputElement).click();
      await nextTick();
      expect(wrapper.emitted('change')).toBeUndefined();
    });

    describe.each(options)('for option "$value"', ({ text, value }) => {
      test('is focusable', async () => {
        const wrapper = await mountInstance({ attachTo: document.body });
        const input = wrapper.find(`input[value="${value}"]`);
        document.body.focus();
        (input.element as HTMLInputElement).focus();
        expect(document.activeElement).toBe(input.element);
      });

      test('is rendered inside a label', async () => {
        const wrapper = await mountInstance();
        const label = wrapper.findAll('label').find(label => label.find(`input[value="${value}"]`).exists());
        expect(label).toBeDefined();
      });

      test('has option text inside its label', async () => {
        const wrapper = await mountInstance();
        const label = wrapper.findAll('label').find(label => label.find(`input[value="${value}"]`).exists());
        expect(label?.text()).toBe(text);
      });

      test('has option value as its value attribute', async () => {
        const wrapper = await mountInstance();
        const input = wrapper.find(`input[value="${value}"]`);
        expect(input.exists()).toBe(true);
        expect((input.element as HTMLInputElement).value).toBe(value);
      });

      if (value === modelValue)
        test('is checked', async () => {
          const wrapper = await mountInstance();
          const input = wrapper.find(`input[value="${value}"]`);
          expect((input.element as HTMLInputElement).checked).toBe(true);
        });

      if (value !== modelValue)
        test('is unchecked', async () => {
          const wrapper = await mountInstance();
          const input = wrapper.find(`input[value="${value}"]`);
          expect((input.element as HTMLInputElement).checked).toBe(false);
        });
    });
  });
});
