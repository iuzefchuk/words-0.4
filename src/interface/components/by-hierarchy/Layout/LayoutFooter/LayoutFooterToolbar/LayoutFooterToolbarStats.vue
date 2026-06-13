<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import useLocalesNamespace from '@/interface/composables/UseLocalesNamespace.ts';
import MainStore from '@/interface/stores/MainStore.ts';
const { t } = useLocalesNamespace('game');
const mainStore = MainStore.INSTANCE();
const { tilesRemaining } = storeToRefs(mainStore);
</script>

<template>
  <Transition name="fade">
    <p v-if="tilesRemaining > 0" role="note" class="stats app__make-secondary">
      <span class="app__make-sr-only">{{ tilesRemaining }}</span>
      <span v-animate-number="{ number: tilesRemaining }" aria-hidden="true" class="stats__number" />
      <span>{{ t('unassigned_count') }}</span>
    </p>
  </Transition>
</template>

<style lang="scss" scoped>
.stats {
  display: flex;
  gap: var(--space-2xs);
  user-select: none;
}
</style>
