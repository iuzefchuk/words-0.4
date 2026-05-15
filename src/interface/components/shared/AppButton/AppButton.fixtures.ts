import FixtureFactory from '@/globals/FixtureFactory.ts';
import { Accent, Key } from '@/interface/enums.ts';
import type { Component } from 'vue';

export default FixtureFactory.createForComponent({
  loadComponent: () =>
    import('@/interface/components/shared/AppButton/AppButton.vue').then(module => module.default as Component),
  props: {
    accent: [Accent.Primary, Accent.Secondary],
    isDisabled: [false, true],
    keys: [[], [Key.Enter], [Key.Enter, Key.Space]],
  },
  slot: ['Go', null],
});
