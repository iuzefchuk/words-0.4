<script lang="ts" setup>
import MainBoardCell from '@/presentation/components/by-hierarchy/Main/MainBoard/MainBoardCell.vue';
import MainBoardOutline from '@/presentation/components/by-hierarchy/Main/MainBoard/MainBoardOutline.vue';
import MainStore from '@/presentation/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
</script>

<template>
  <ul
    :class="{
      'app__create-grid': true,
      'app__create-grid--for-board': true,
      'app__limit-max-width': true,
      grid: true,
    }"
  >
    <MainBoardCell v-for="cell in mainStore.boardCells" :key="cell" :cell="cell" />
    <MainBoardOutline />
  </ul>
</template>
