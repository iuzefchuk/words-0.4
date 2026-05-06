<script lang="ts" setup>
import MainPlayfieldCell from '@/interface/components/by-hierarchy/Main/MainPlayfield/MainPlayfieldCell.vue';
import MainPlayfieldOutline from '@/interface/components/by-hierarchy/Main/MainPlayfield/MainPlayfieldOutline.vue';
import MainStore from '@/interface/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
</script>

<template>
  <section class="playfield app__limit-max-width">
    <ul class="app__create-grid--for-board">
      <MainPlayfieldCell v-for="cell in mainStore.boardCells" :key="cell" :cell="cell" />
      <MainPlayfieldOutline />
    </ul>
  </section>
</template>
