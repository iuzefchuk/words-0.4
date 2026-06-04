<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import MainStore from '@/interface/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
const { bootProgress } = storeToRefs(mainStore);
// TODO improve design
</script>

<template>
  <progress
    class="progress"
    :value="bootProgress"
    min="0"
    max="100"
    aria-label="Boot progress"
    :style="{ '--boot-progress': `${String(bootProgress)}%` }"
  />
</template>

<style lang="scss" scoped>
.progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: var(--boot-progress, 0%);
  height: 2px;
  transition-property: width;
  transition-duration: var(--transition-duration);
  transition-timing-function: var(--transition-timing-function);
  appearance: none;
  display: block;

  &,
  &::-webkit-progress-value,
  &::-moz-progress-bar {
    background: var(--progress-color);
  }

  &::-webkit-progress-bar {
    background: transparent;
  }
}
</style>
