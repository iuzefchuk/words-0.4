import { enableAutoUnmount } from '@vue/test-utils';
import { afterEach, describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import FixtureFactory from '@/globals/FixtureFactory.ts';
import AppRadioGroup from '@/interface/components/shared/AppRadioGroup/AppRadioGroup.vue';

enableAutoUnmount(afterEach);

const fixtures = [0, 1, 2, 3].flatMap(count => {
  const options = Array.from({ length: count }, (_, idx) => ({
    text: `Option ${String(idx + 1)}`,
    value: `option-${String(idx + 1)}`,
  }));
  return options.flatMap(option =>
    FixtureFactory.createForComponent({
      component: AppRadioGroup,
      props: {
        legend: [`Legend (${String(count)} options)`],
        modelValue: [option.value],
        options: [options],
      },
    }),
  );
});

describe('AppRadioGroup', () => {
  describe.each(fixtures)('for $desc', fixture => {
    const {
      mountInstance,
      props: { legend, modelValue, options },
    } = fixture;
    const otherOption = options.find(option => option.value !== modelValue);

    test('mounts', () => {
      expect(() => mountInstance()).not.toThrow();
    });

    test('renders fieldset with legend', () => {
      const wrapper = mountInstance();
      const fieldset = wrapper.find('fieldset');
      expect(fieldset.exists()).toBe(true);
      const legendEl = fieldset.find('legend');
      expect(legendEl.exists()).toBe(true);
      expect(legendEl.text()).toBe(legend);
    });

    test('renders one radio input per option', () => {
      const wrapper = mountInstance();
      expect(wrapper.findAll('input[type="radio"]')).toHaveLength(options.length);
    });

    test('renders one label per option', () => {
      const wrapper = mountInstance();
      expect(wrapper.findAll('label')).toHaveLength(options.length);
    });

    test('accepts only modelValue which matches one of the options values', () => {
      const wrapper = mountInstance();
      const checkedValues = wrapper
        .findAll('input[type="radio"]')
        .filter(input => (input.element as HTMLInputElement).checked)
        .map(input => (input.element as HTMLInputElement).value);
      expect(checkedValues).toEqual([modelValue]);
    });

    test('emits change with the option value when unselected radio is selected', async () => {
      if (otherOption === undefined) return;
      const wrapper = mountInstance({ attachTo: document.body });
      const input = wrapper.find(`input[value="${otherOption.value}"]`);
      (input.element as HTMLInputElement).click();
      await nextTick();
      expect(wrapper.emitted('change')).toEqual([[otherOption.value]]);
    });

    test('does not emit change with the option value when selected radio is selected', async () => {
      const wrapper = mountInstance({ attachTo: document.body });
      const input = wrapper.find(`input[value="${modelValue}"]`);
      (input.element as HTMLInputElement).click();
      await nextTick();
      expect(wrapper.emitted('change')).toBeUndefined();
    });

    describe.each(options)('for option "$value"', ({ text, value }) => {
      test('is focusable', () => {
        const wrapper = mountInstance({ attachTo: document.body });
        const input = wrapper.find(`input[value="${value}"]`);
        document.body.focus();
        (input.element as HTMLInputElement).focus();
        expect(document.activeElement).toBe(input.element);
      });

      test('is rendered inside a label', () => {
        const wrapper = mountInstance();
        const label = wrapper.findAll('label').find(label => label.find(`input[value="${value}"]`).exists());
        expect(label).toBeDefined();
      });

      test('has option text inside its label', () => {
        const wrapper = mountInstance();
        const label = wrapper.findAll('label').find(label => label.find(`input[value="${value}"]`).exists());
        expect(label?.text()).toBe(text);
      });

      test('has option value as its value attribute', () => {
        const wrapper = mountInstance();
        const input = wrapper.find(`input[value="${value}"]`);
        expect(input.exists()).toBe(true);
        expect((input.element as HTMLInputElement).value).toBe(value);
      });

      if (value === modelValue)
        test('is checked', () => {
          const wrapper = mountInstance();
          const input = wrapper.find(`input[value="${value}"]`);
          expect((input.element as HTMLInputElement).checked).toBe(true);
        });

      if (value !== modelValue)
        test('is unchecked', () => {
          const wrapper = mountInstance();
          const input = wrapper.find(`input[value="${value}"]`);
          expect((input.element as HTMLInputElement).checked).toBe(false);
        });
    });
  });
});
