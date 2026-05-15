import FixtureFactory from '@/globals/FixtureFactory.ts';
import type { Component } from 'vue';

export default [0, 1, 2, 3].flatMap(count => {
  const options = Array.from({ length: count }, (_, idx) => ({
    text: `Option ${String(idx + 1)}`,
    value: `option-${String(idx + 1)}`,
  }));
  return options.flatMap(option =>
    FixtureFactory.createForComponent({
      loadComponent: () =>
        import('@/interface/components/primitives/AppRadioGroup/AppRadioGroup.vue').then(module => module.default as Component),
      props: {
        legend: [`Legend (${String(count)} options)`],
        modelValue: [option.value],
        options: [options],
      },
    }),
  );
});
