<script lang="ts" setup>
import LayoutMainGridOutlineTooltip from '@/interface/components/by-hierarchy/Layout/LayoutMain/LayoutMainGrid/LayoutMainGridOutline/LayoutMainGridOutlineTooltip.vue';
import UseOutline from '@/interface/composables/UseOutline.ts';
const { bounds, isAnchorAt, isOnRightmostColumnAt } = new UseOutline();
</script>

<template>
  <div
    v-for="(group, idx) in bounds"
    :key="idx"
    class="outline"
    role="presentation"
    :style="{
      '--outline-grid-step': `calc((100% + var(--grid-gap)) / var(--grid-items-per-axis))`,
      top: `calc(var(--outline-grid-step) * ${group.row})`,
      left: `calc(var(--outline-grid-step) * ${group.col})`,
      width: `calc(var(--outline-grid-step) * ${group.colSpan} - var(--grid-gap) - 1px)`,
      height: `calc(var(--outline-grid-step) * ${group.rowSpan} - var(--grid-gap) - 1px)`,
    }"
  >
    <Transition name="fade" appear>
      <LayoutMainGridOutlineTooltip v-if="isAnchorAt(idx)" :is-flipped="isOnRightmostColumnAt(idx)" />
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.outline {
  position: absolute;
  z-index: var(--z-index-level-1);
  pointer-events: none;
  outline: var(--tile-outline);
  border-radius: var(--grid-item-radius);
  transition-property: top, left, width, height, outline;
  transition-duration: var(--transition-duration-half);
  transition-timing-function: var(--transition-timing-function);
}
</style>
