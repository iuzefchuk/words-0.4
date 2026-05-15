import FixtureFactory from '@/globals/FixtureFactory.ts';
import type { Component } from 'vue';

export default FixtureFactory.createForComponent({
  loadComponent: () => import('@/interface/components/shared/AppCell/AppCell.vue').then(module => module.default as Component),
  props: {
    bonus: [],
    colIndex: [],
    isFocused: [],
    isHighlighted: [],
    isOccupied: [],
    label: [],
    role: [],
    rowIndex: [],
  },
});
