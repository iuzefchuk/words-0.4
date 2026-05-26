<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import MainStore from '@/interface/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
const { bootProgress } = storeToRefs(mainStore);
// TODO improve design
</script>

<template>
  <progress
    class="loader"
    :value="bootProgress"
    min="0"
    max="100"
    aria-label="Boot progress"
    :style="{ '--loader-progress': `${String(bootProgress)}%` }"
  />
</template>

<style lang="scss" scoped>
.loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: var(--loader-progress, 0%);
  height: 2px;
  background: var(--loader-color);
  transition-property: width;
  transition-duration: var(--transition-duration);
  transition-timing-function: var(--transition-timing-function);
  appearance: none;
  display: block;
  &::-webkit-progress-bar {
    background: transparent;
  }
  &::-webkit-progress-value {
    background: var(--loader-color);
  }
  &::-moz-progress-bar {
    background: var(--loader-color);
  }
}
</style>
