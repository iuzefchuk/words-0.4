<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import MainStore from '@/interface/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
const { tilesRemaining } = storeToRefs(mainStore);
</script>

<template>
  <Transition name="fade">
    <p v-if="tilesRemaining > 0" role="note" class="annotation app__make-secondary">
      <span class="app__make-sr-only">{{ tilesRemaining }}</span>
      <span v-animate-number="{ number: tilesRemaining }" aria-hidden="true" class="annotation__number" />
      <span>{{ text('general.unassigned_count') }}</span>
    </p>
  </Transition>
</template>

<style lang="scss" scoped>
.annotation {
  display: flex;
  gap: var(--space-2xs);
  user-select: none;
}
</style>
