<script lang="ts" setup>
import { computed } from 'vue';
import { launchError } from '@/interface/stores/MainStore.ts';
const message = computed(() =>
  launchError.value === null ? '' : window.text('game.error_launch', { error: launchError.value }),
);
</script>

<template>
  <Transition name="fade-down-up" appear>
    <div v-if="launchError" class="banner" role="alert" v-html="message" />
  </Transition>
</template>

<style lang="scss" scoped>
.banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: var(--space-l);
  background: var(--banner-bg);
  color: var(--banner-color);
  text-align: center;
  z-index: var(--z-index-level-3);
}
</style>
