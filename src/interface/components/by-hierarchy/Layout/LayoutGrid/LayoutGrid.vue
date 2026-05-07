<script lang="ts" setup>
import { provide, useTemplateRef } from 'vue';
import LayoutGridItem from '@/interface/components/by-hierarchy/Layout/LayoutGrid/LayoutGridItem.vue';
import LayoutGridOutline from '@/interface/components/by-hierarchy/Layout/LayoutGrid/LayoutGridOutline.vue';
import UseRovingTabindex from '@/interface/composables/UseRovingTabindex.ts';
import { LabeledElement } from '@/interface/enums.ts';
import { getElementLabel } from '@/interface/mappings.ts';
import MainStore from '@/interface/stores/MainStore.ts';
const CELL_ROLE = 'gridcell';
const GRID_REF = 'grid';
const mainStore = MainStore.INSTANCE();
const rovingTabindex = new UseRovingTabindex(
  useTemplateRef<HTMLElement>(GRID_REF),
  `[role="${CELL_ROLE}"]`,
  mainStore.boardCellsPerAxis,
);
provide('cellRole', CELL_ROLE);
provide('focusedItemIndex', rovingTabindex.focusedIndex);
</script>

<template>
  <main class="grid app__limit-max-width" :aria-label="getElementLabel(LabeledElement.LayoutGrid)">
    <div
      :ref="GRID_REF"
      class="grid__inner app__create-grid--for-board"
      role="grid"
      :aria-rowcount="mainStore.boardCellsPerAxis"
      :aria-colcount="mainStore.boardCellsPerAxis"
      @keydown="rovingTabindex.onKeydown"
    >
      <LayoutGridItem v-for="(cell, idx) in mainStore.boardCells" :key="cell" :cell="cell" :index="idx" />
    </div>
    <LayoutGridOutline />
  </main>
</template>

<style lang="scss" scoped>
.grid {
  width: 100%;
  position: relative;
  &__inner {
    width: 100%;
  }
}
</style>
