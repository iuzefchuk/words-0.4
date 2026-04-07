<script lang="ts" setup>
import { GameLetter } from '@/application/types.ts';
import { getLetterSvgHtml } from '@/presentation/mappings.ts';
withDefaults(
  defineProps<{
    isInverted?: boolean;
    isSaturated?: boolean;
    letter: GameLetter;
  }>(),
  { isInverted: false, isSaturated: false },
);
</script>

<template>
  <div
    :class="{
      tile: true,
      'tile--inverted': isInverted,
      'tile--saturated': isSaturated,
    }"
  >
    <svg class="tile__svg" viewBox="0 0 21 21" v-html="getLetterSvgHtml(letter)"></svg>
  </div>
</template>

<style lang="scss">
.tile {
  cursor: pointer;
  color: var(--tile-color);
  transition-property: background, color, outline;
  transition-duration: var(--transition-duration-half);
  transition-timing-function: var(--transition-timing-function);
  z-index: var(--z-index-level-1);
  display: grid;
  filter: drop-shadow(0 1px transparent);
  &::before {
    content: '';
    grid-area: 1 / 1;
    background: var(--tile-bg);
    clip-path: inset(0 round var(--tile-radius, var(--primary-border-radius)));
  }
  &--inverted:not(&--saturated)::before {
    background: var(--tile-bg-inverted);
  }
  &--inverted:not(&--saturated) {
    color: var(--tile-color-inverted);
  }
  &--saturated::before {
    background: var(--tile-bg-saturated);
  }
  &__svg {
    grid-area: 1 / 1;
    display: block;
    width: 100%;
    height: 100%;
    fill: currentColor;
    z-index: 1;
  }
}
</style>
