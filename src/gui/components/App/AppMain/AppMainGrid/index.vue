<script lang="ts" setup>
import AppMainGridSlot from '@/gui/components/App/AppMain/AppMainGrid/AppMainGridSlot.vue';
import AppMainGridTooltip from '@/gui/components/App/AppMain/AppMainGrid/AppMainGridTooltip.vue';
import GameStore from '@/gui/stores/GameStore.ts';
const storeGame = GameStore.getInstance();
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
    <AppMainGridSlot v-for="cell in storeGame.layoutCells" :key="cell" :cell="cell">
      <Transition name="fade" appear>
        <AppMainGridTooltip v-if="storeGame.isCellLastConnectionInTurn(cell)" />
      </Transition>
    </AppMainGridSlot>
  </ul>
</template>

<style lang="scss" scoped>
.grid {
  aspect-ratio: 1 / 1;
  justify-self: center;
  align-self: center;
}
</style>
