<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import MainStore from '@/interface/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
const { bootProgress } = storeToRefs(mainStore);
const displayedWidth = computed(() => bootProgress.value + 25);
</script>

<template>
  <div class="loader" :style="{ width: `${displayedWidth}%` }" />
</template>

<style lang="scss" scoped>
.loader {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  background: var(--color-rose-500);
  transition-property: width;
  transition-duration: var(--transition-duration);
  transition-timing-function: var(--transition-timing-function);
}
</style>
