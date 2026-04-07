<script lang="ts" setup>
import MainBoardCell from '@/gui/components/by-hierarchy/Main/MainBoard/MainBoardCell.vue';
import MainBoardOutline from '@/gui/components/by-hierarchy/Main/MainBoard/MainBoardOutline/MainBoardOutline.vue';
import MainStore from '@/gui/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
</script>

<template>
  <ul
    :class="{
      app__grid: true,
      'app__grid--board': true,
      'app__width-content': true,
      grid: true,
    }"
  >
    <MainBoardCell v-for="cell in mainStore.boardCells" :key="cell" :cell="cell" />
    <MainBoardOutline />
  </ul>
</template>
