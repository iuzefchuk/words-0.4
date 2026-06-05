<script lang="ts" setup>
import { computed } from 'vue';
import { Accent } from '@/interface/enums.ts';
import { getBonusAccent, getBonusName } from '@/interface/mappings.ts';
import type { GameBonus } from '@/app/types/index.ts';
const props = defineProps<{
  bonus: GameBonus | null;
  colIndex: number;
  isFocused: boolean;
  isHighlighted: boolean;
  isOccupied: boolean;
  rowIndex: number;
}>();
defineEmits<{
  activate: [];
  doubleActivate: [];
}>();

const bonusAccent = computed(() => (props.bonus === null ? undefined : getBonusAccent(props.bonus)));
</script>

<template>
  <button
    role="gridcell"
    :tabindex="isFocused ? 0 : -1"
    :aria-rowindex="rowIndex"
    :aria-colindex="colIndex"
    :aria-label="!isOccupied && bonus === null ? `Row ${rowIndex}, Column ${colIndex}, empty` : undefined"
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
      role="note"
      :class="{
        cell__bonus: true,
        'cell__bonus--primary': bonusAccent === Accent.Primary,
        'cell__bonus--secondary': bonusAccent === Accent.Secondary,
        'cell__bonus--tertiary': bonusAccent === Accent.Tertiary,
        'cell__bonus--quaternary': bonusAccent === Accent.Quaternary,
      }"
      viewBox="0 0 40 40"
    >
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central">{{ getBonusName(bonus) }}</text>
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
