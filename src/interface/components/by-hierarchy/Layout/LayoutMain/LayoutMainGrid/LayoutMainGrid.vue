<script lang="ts" setup>
import { computed, provide, useTemplateRef } from 'vue';
import LayoutMainGridCell from '@/interface/components/by-hierarchy/Layout/LayoutMain/LayoutMainGrid/LayoutMainGridCell.vue';
import LayoutMainGridOutline from '@/interface/components/by-hierarchy/Layout/LayoutMain/LayoutMainGrid/LayoutMainGridOutline/LayoutMainGridOutline.vue';
import UseRovingTabindex from '@/interface/composables/UseRovingTabindex.ts';
import MainStore from '@/interface/stores/MainStore.ts';
const REF_KEY = 'grid';
const mainStore = MainStore.INSTANCE();
const rovingTabindex = new UseRovingTabindex(
  useTemplateRef<HTMLElement>(REF_KEY),
  `[role="gridcell"]`,
  mainStore.playfieldCellsPerAxis,
);

const rows = computed(() => {
  const size = mainStore.playfieldCellsPerAxis;
  return Array.from({ length: size }, (_, row) =>
    mainStore.playfieldCells.slice(row * size, (row + 1) * size).map((cell, col) => ({ cell, index: row * size + col })),
  );
});

provide('focusedItemIndex', rovingTabindex.focusedIndex);
</script>

<template>
  <div
    :ref="REF_KEY"
    class="grid app__create-grid--for-main-grid"
    role="grid"
    :aria-rowcount="mainStore.playfieldCellsPerAxis"
    :aria-colcount="mainStore.playfieldCellsPerAxis"
    @keydown="rovingTabindex.onKeydown"
  >
    <div v-for="(row, rowIdx) in rows" :key="rowIdx" role="row" :aria-rowindex="rowIdx + 1" class="grid__row">
      <LayoutMainGridCell v-for="{ cell, index } in row" :key="cell" :cell="cell" :index="index" />
    </div>
    <LayoutMainGridOutline />
  </div>
</template>

<style lang="scss" scoped>
@use '../../../../../assets/style/breakpoints.scss' as *;

.grid {
  width: 100%;
  position: relative;

  &__row {
    display: contents;
  }

  & > &__row > * {
    display: grid;
    aspect-ratio: 1 / 1;
    grid-area: auto;

    > * {
      grid-area: 1 / 1;
    }
  }
}
</style>
