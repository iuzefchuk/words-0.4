import { GameLetter } from '@/application/types/index.ts';
import FixtureFactory from '@/globals/FixtureFactory.ts';
import { Accent } from '@/interface/enums.ts';
import type { Component } from 'vue';

export default FixtureFactory.createForComponent({
  loadComponent: () => import('@/interface/components/shared/AppTile/AppTile.vue').then(module => module.default as Component),
  props: {
    accent: [Accent.Primary, Accent.Secondary, Accent.Tertiary],
    letter: Object.values(GameLetter),
  },
});
