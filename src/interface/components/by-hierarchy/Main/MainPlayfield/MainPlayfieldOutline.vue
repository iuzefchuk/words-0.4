<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import MainPlayfieldTooltip from '@/interface/components/by-hierarchy/Main/MainPlayfield/MainPlayfieldTooltip.vue';
import UseTileLocator from '@/interface/composables/UseTileLocator.ts';
import UserStore from '@/interface/stores/UserStore.ts';
const userStore = UserStore.INSTANCE();
const tileLocator = new UseTileLocator();
const { tiles } = storeToRefs(userStore);
const locations = computed(() => tileLocator.getLocationsFor(tiles.value));
const CELL_STEP = 'calc((100% + var(--grid-gap)) / var(--grid-items-per-axis))';
</script>

<template>
  <div
    v-for="(group, idx) in locations"
    :key="idx"
    class="outline"
    :style="{
      top: `calc(${CELL_STEP} * ${group.row})`,
      left: `calc(${CELL_STEP} * ${group.col})`,
      width: `calc(${CELL_STEP} * ${group.colSpan} - var(--grid-gap) - 1px)`,
      height: `calc(${CELL_STEP} * ${group.rowSpan} - var(--grid-gap) - 1px)`,
    }"
  >
    <Transition name="fade" appear>
      <MainPlayfieldTooltip
        v-if="tileLocator.areLocationsForSelectedTiles(locations, idx)"
        :is-flipped="tileLocator.isLocationOnRightmostColumn(locations, idx)"
      />
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.outline {
  position: absolute;
  z-index: var(--z-index-level-1);
  outline: var(--tile-outline);
  border-radius: var(--grid-item-radius);
  transition-property: top, left, width, height, outline;
  transition-duration: var(--transition-duration-half);
  transition-timing-function: var(--transition-timing-function);
  pointer-events: none;
}
</style>
