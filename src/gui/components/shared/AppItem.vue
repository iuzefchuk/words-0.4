<script lang="ts" setup>
import { watch, ref, inject } from 'vue';
import { transitionDurationMsKey } from '@/gui/plugins/provides/index.ts';
const transitionDurationMs = inject(transitionDurationMsKey);
const transitionIsDisabled = ref(false);
defineProps({
  svgHtml: { type: String, required: true },
  isInverted: { type: Boolean, default: false },
  isHighlighted: { type: Boolean, default: false },
  isElevated: { type: Boolean, default: false },
});
// watch(
//   () => props.letter,
//   newValue => {
//     if (newValue) transitionIsDisabled.value = true; // TODO test
//     setTimeout(() => {
//       transitionIsDisabled.value = false;
//     }, transitionDurationMs);
//   },
// );
// TODO test
</script>

<template>
  <svg
    :class="{
      item: true,
      'item--inverted': isInverted,
      'item--highlighted': isHighlighted,
      'item--elevated': isElevated,
      'item--transition-is-disabled': transitionIsDisabled,
    }"
    viewBox="0 0 21 21"
    v-html="svgHtml"
  ></svg>
</template>

<style lang="scss">
.item {
  cursor: pointer;
  fill: currentColor;
  aspect-ratio: 1 / 1;
  color: var(--tile-color);
  background: var(--tile-bg);
  border-radius: inherit;
  transition-property: top, left, background, color, box-shadow;
  transition-duration: var(--transition-duration);
  transition-timing-function: var(--transition-timing-function);
  position: relative;
  top: 0;
  left: 0;
  &--transition-is-disabled {
    transition-duration: 0ms;
  }
  &--inverted:not(&--highlighted) {
    background: var(--tile-bg-inverted);
    color: var(--tile-color-inverted);
  }
  &--highlighted:not(&--elevated) {
    background: var(--tile-bg-highlighted);
  }
  &--elevated {
    box-shadow: calc(var(--tile-shadow-inset-elevated) * -1) var(--tile-shadow-inset-elevated) var(--tile-shadow-color);
    top: calc(var(--tile-shadow-inset-elevated) * -1) !important;
    left: var(--tile-shadow-inset-elevated) !important;
  }
  &--elevated:is(&--inverted) {
    box-shadow: calc(var(--tile-shadow-inset-elevated) * -1) var(--tile-shadow-inset-elevated)
      var(--tile-shadow-color-inverted);
  }
}
</style>
