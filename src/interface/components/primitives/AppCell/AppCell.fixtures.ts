import { type GameBonus } from '@/application/types/index.ts';
import FixtureFactory from '@/globals/FixtureFactory.ts';
import type { Component } from 'vue';

export default FixtureFactory.createForComponent({
  loadComponent: (): Promise<Component> =>
    import('@/interface/components/primitives/AppCell/AppCell.vue').then(module => module.default as Component),
  props: {
    bonus: [] as ReadonlyArray<GameBonus | null>,
    colIndex: [] as ReadonlyArray<number>,
    isFocused: [] as ReadonlyArray<boolean>,
    isHighlighted: [] as ReadonlyArray<boolean>,
    isOccupied: [] as ReadonlyArray<boolean>,
    label: [] as ReadonlyArray<string | undefined>,
    role: [] as ReadonlyArray<string>,
    rowIndex: [] as ReadonlyArray<number>,
  },
});
