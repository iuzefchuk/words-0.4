<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import MainStore from '@/interface/stores/MainStore.ts';
const { bootError } = storeToRefs(MainStore.INSTANCE());
</script>

<template>
  <p v-if="bootError" class="banner" role="alert" v-html="text('general.error_launch', { error: bootError })" />
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
