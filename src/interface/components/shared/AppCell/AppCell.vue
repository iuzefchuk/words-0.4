<script lang="ts" setup>
import { Accent } from '@/interface/enums.ts';
defineProps<{
  ariaLabel?: string | undefined;
  bonus?: { accent: Accent; name: string } | undefined;
  cellRole: string;
  colIndex: number;
  isFocused: boolean;
  isHighlighted?: boolean | undefined;
  isOccupied?: boolean | undefined;
  isPressed?: boolean | undefined;
  rowIndex: number;
}>();
defineEmits<{
  activate: [];
  doubleActivate: [];
}>();
</script>

<template>
  <button
    type="button"
    :role="cellRole"
    :tabindex="isFocused ? 0 : -1"
    :aria-rowindex="rowIndex"
    :aria-colindex="colIndex"
    :aria-pressed="isPressed"
    :aria-label="ariaLabel"
    :class="{
      cell: true,
      'cell--highlighted': isHighlighted,
      'cell--occupied': isOccupied,
    }"
    @click.stop="$emit('activate')"
    @keydown.enter.prevent.stop="$emit('activate')"
    @dblclick.stop="$emit('doubleActivate')"
  >
    <svg
      v-if="bonus"
      aria-hidden="true"
      :class="{
        cell__bonus: true,
        'cell__bonus--primary': bonus.accent === Accent.Primary,
        'cell__bonus--secondary': bonus.accent === Accent.Secondary,
        'cell__bonus--tertiary': bonus.accent === Accent.Tertiary,
        'cell__bonus--quaternary': bonus.accent === Accent.Quaternary,
      }"
      viewBox="0 0 40 40"
    >
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central">{{ bonus.name }}</text>
    </svg>
    <slot />
  </button>
</template>

<style lang="scss" scoped>
.cell {
  max-width: var(--grid-item-size);
  border-radius: var(--grid-item-radius);
  background: var(--cell-bg);
  user-select: none;
  box-shadow: var(--cell-shadow);
  cursor: pointer;
  &--highlighted {
    background: var(--cell-bg-highlighted);
  }
  &--highlighted,
  &--occupied {
    box-shadow: none;
  }
  &__bonus {
    font-weight: var(--font-weight-big);
    z-index: var(--z-index-level-1);
    opacity: var(--cell-opacity-bonus);
    font-size: 15px;
    $accents: 'primary', 'secondary', 'tertiary', 'quaternary';
    @each $accent in $accents {
      &--#{$accent} text {
        fill: var(--cell-color-#{$accent});
      }
    }
  }
}
</style>
