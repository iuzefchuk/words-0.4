<script lang="ts" setup>
import { Accent } from '@/interface/enums.ts';
import type { GameLetter } from '@/application/types/index.ts';
const props = defineProps<{
  accent: Accent;
  letter: GameLetter;
  points: number;
}>();
</script>

<template>
  <svg
    role="note"
    :aria-label="`${letter} letter / ${points} pts`"
    viewBox="0 0 40 40"
    :class="{
      tile: true,
      'tile--primary': props.accent === Accent.Primary,
      'tile--secondary': props.accent === Accent.Secondary,
      'tile--tertiary': props.accent === Accent.Tertiary,
    }"
  >
    <text class="tile__letter" x="45%" y="45%" font-size="22" text-anchor="middle" dominant-baseline="central">
      {{ letter }}
    </text>
    <text class="tile__points" x="78%" y="78%" font-size="13" text-anchor="middle" dominant-baseline="central">
      {{ points }}
    </text>
  </svg>
</template>

<style lang="scss" scoped>
.tile {
  cursor: pointer;
  fill: currentcolor;
  display: block;
  aspect-ratio: 1 / 1;
  border-radius: inherit;
  box-shadow: var(--shadow-xs);
  transition-property: background, color, outline;
  transition-duration: var(--transition-duration-half);
  transition-timing-function: var(--transition-timing-function);
  position: relative;
  top: 0;
  left: 0;
  z-index: var(--z-index-level-1);
  min-height: 100%;
  user-select: none;

  $accents: 'primary', 'secondary', 'tertiary';

  @each $accent in $accents {
    &--#{$accent} {
      --tile-pts-color: var(--tile-pts-color-#{$accent});

      background: var(--tile-bg-#{$accent});
      color: var(--tile-color-#{$accent});
    }
  }

  &__letter {
    font-weight: var(--font-weight-big);
  }

  &__points {
    color: var(--tile-pts-color);
  }
}
</style>
