<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { LabeledElement } from '@/interface/enums.ts';
import { getElementLabel } from '@/interface/mappings.ts';
import MainStore from '@/interface/stores/MainStore.ts';
const props = defineProps<{ isFlipped?: boolean }>();
const mainStore = MainStore.INSTANCE();
const { currentTurnScore } = storeToRefs(mainStore);
const SHIMMER_THRESHOLD = 29;
const ariaLabel = computed(() =>
  currentTurnScore.value === undefined
    ? ''
    : getElementLabel(LabeledElement.LayoutGridTooltip, { score: currentTurnScore.value }),
);
</script>

<template>
  <output v-if="currentTurnScore" :aria-label="ariaLabel" :class="{ tooltip: true, 'tooltip--flipped': props.isFlipped }">
    <span aria-hidden="true" :class="{ tooltip__value: true, 'tooltip__value--shimmer': currentTurnScore > SHIMMER_THRESHOLD }">
      {{ currentTurnScore }}
    </span>
  </output>
</template>

<style lang="scss" scoped>
.tooltip {
  position: absolute;
  top: calc(-1 * var(--space-xl));
  right: calc(-1 * var(--space-xl));
  width: var(--space-3xl);
  height: var(--space-3xl);
  z-index: var(--z-index-level-2);
  display: grid;
  place-items: center;
  &--flipped {
    right: auto;
    left: calc(-1 * var(--space-xl));
  }
  &__value {
    width: max-content;
    height: max-content;
    padding: var(--space-4xs) var(--space-2xs);
    font-weight: var(--font-weight);
    background: var(--tooltip-bg);
    color: var(--tooltip-color);
    font-size: var(--font-size-small);
    border-radius: var(--space-3xs);
    box-shadow: var(--shadow-2xl);
    &--shimmer {
      background: linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet, red);
      background-size: 300% 100%;
      animation: shimmer 3s linear infinite;
    }
  }
}
</style>
