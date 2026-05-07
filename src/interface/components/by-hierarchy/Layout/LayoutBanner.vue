<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import MainStore from '@/interface/stores/MainStore.ts';
const { bootError } = storeToRefs(MainStore.INSTANCE());
const message = computed(() => (bootError.value === null ? '' : window.text('general.error_launch', { error: bootError.value })));
</script>

<template>
  <div v-if="bootError" class="banner" role="status" v-html="message" />
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
