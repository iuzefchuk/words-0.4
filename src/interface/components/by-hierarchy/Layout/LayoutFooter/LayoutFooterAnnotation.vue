<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { LabeledElement } from '@/interface/enums.ts';
import { getElementLabel } from '@/interface/mappings.ts';
import MainStore from '@/interface/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
const { tilesRemaining } = storeToRefs(mainStore);
const ariaLabel = computed(() => getElementLabel(LabeledElement.LayoutFooterAnnotation, { count: tilesRemaining.value }));
</script>

<template>
  <Transition name="fade">
    <p v-if="tilesRemaining > 0" class="annotation app__make-secondary" :aria-label="ariaLabel">
      <span v-animate-number="{ number: tilesRemaining }" aria-hidden="true" class="annotation__number" />
      <span aria-hidden="true">{{ text('general.unassigned_count') }}</span>
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
