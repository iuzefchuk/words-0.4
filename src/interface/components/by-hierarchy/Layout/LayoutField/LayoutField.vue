<script lang="ts" setup>
import { provide, useTemplateRef } from 'vue';
import LayoutFieldOutline from '@/interface/components/by-hierarchy/Layout/LayoutField/LayoutFieldOutline.vue';
import LayoutFieldSquare from '@/interface/components/by-hierarchy/Layout/LayoutField/LayoutFieldSquare.vue';
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
provide('focusedSquareIndex', rovingTabindex.focusedIndex);
</script>

<template>
  <main class="field app__limit-max-width" :aria-label="getElementLabel(LabeledElement.LayoutField)">
    <div
      :ref="GRID_REF"
      class="field__grid app__create-grid--for-board"
      role="grid"
      :aria-rowcount="mainStore.boardCellsPerAxis"
      :aria-colcount="mainStore.boardCellsPerAxis"
      @keydown="rovingTabindex.onKeydown"
    >
      <LayoutFieldSquare v-for="(cell, idx) in mainStore.boardCells" :key="cell" :cell="cell" :index="idx" />
    </div>
    <LayoutFieldOutline />
  </main>
</template>

<style lang="scss" scoped>
.field {
  width: 100%;
  position: relative;
  &__grid {
    width: 100%;
  }
}
</style>
