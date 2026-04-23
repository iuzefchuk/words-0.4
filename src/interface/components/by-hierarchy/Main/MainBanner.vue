<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import MainStore from '@/interface/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
const { dictionaryLoadError } = storeToRefs(mainStore);
const message = computed(() =>
  dictionaryLoadError.value !== null ? window.text('game.error_dictionary_load', { error: dictionaryLoadError.value }) : '',
);
</script>

<template>
  <Transition name="fade-down-up" appear>
    <div v-if="dictionaryLoadError" class="banner" role="alert" v-html="message" />
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
