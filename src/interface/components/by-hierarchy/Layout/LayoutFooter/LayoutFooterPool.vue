<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import MainStore from '@/interface/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
const { tilesRemaining } = storeToRefs(mainStore);
const ariaLabel = computed(() => window.text('general.aria_footer_pool', { count: tilesRemaining.value }));
</script>

<template>
  <Transition name="fade">
    <p v-if="tilesRemaining > 0" class="pool app__make-secondary" :aria-label="ariaLabel">
      <span v-animate-number="{ number: tilesRemaining }" aria-hidden="true" class="pool__number" />
      <span aria-hidden="true">{{ text('general.unassigned_count') }}</span>
    </p>
  </Transition>
</template>

<style lang="scss" scoped>
.pool {
  display: flex;
  gap: var(--space-2xs);
  user-select: none;
}
</style>
