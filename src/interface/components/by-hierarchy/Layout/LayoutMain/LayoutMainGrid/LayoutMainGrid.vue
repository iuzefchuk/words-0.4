<script lang="ts" setup>
import { computed, provide, useTemplateRef } from 'vue';
import LayoutMainGridItem from '@/interface/components/by-hierarchy/Layout/LayoutMain/LayoutMainGrid/LayoutMainGridItem.vue';
import LayoutMainGridOutline from '@/interface/components/by-hierarchy/Layout/LayoutMain/LayoutMainGrid/LayoutMainGridOutline/LayoutMainGridOutline.vue';
import UseRovingTabindex from '@/interface/composables/UseRovingTabindex/UseRovingTabindex.ts';
import MainStore from '@/interface/stores/MainStore/MainStore.ts';
const CELL_ROLE = 'gridcell';
const REF_GRID = 'grid';
const mainStore = MainStore.INSTANCE();
const rovingTabindex = new UseRovingTabindex(
  useTemplateRef<HTMLElement>(REF_GRID),
  `[role="${CELL_ROLE}"]`,
  mainStore.boardCellsPerAxis,
);
const rows = computed(() => {
  const size = mainStore.boardCellsPerAxis;
  return Array.from({ length: size }, (_, row) =>
    mainStore.boardCells.slice(row * size, (row + 1) * size).map((cell, col) => ({ cell, index: row * size + col })),
  );
});
provide('cellRole', CELL_ROLE);
provide('focusedItemIndex', rovingTabindex.focusedIndex);
</script>

<template>
  <div
    :ref="REF_GRID"
    class="grid app__create-grid--for-board"
    role="grid"
    :aria-rowcount="mainStore.boardCellsPerAxis"
    :aria-colcount="mainStore.boardCellsPerAxis"
    @keydown="rovingTabindex.onKeydown"
  >
    <div v-for="(row, rowIdx) in rows" :key="rowIdx" role="row" :aria-rowindex="rowIdx + 1" class="grid__row">
      <LayoutMainGridItem v-for="{ cell, index } in row" :key="cell" :cell="cell" :index="index" />
    </div>
    <LayoutMainGridOutline />
  </div>
</template>

<style lang="scss" scoped>
@use '@style/breakpoints.scss' as *;
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
