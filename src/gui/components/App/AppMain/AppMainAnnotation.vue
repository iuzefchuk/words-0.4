<script lang="ts" setup>
import { computed } from 'vue';
import { TurnOutcomeType, type TurnOutcome } from '@/domain/models/TurnTracker.ts';
import MatchStore from '@/gui/stores/MatchStore.ts';
const MAX_OUTCOMES = 3;
const matchStore = MatchStore.INSTANCE();
const messages = computed(() => matchStore.outcomeHistory.slice(-MAX_OUTCOMES));
function convertMessageToHtml(message: TurnOutcome): string {
  if (message.type === TurnOutcomeType.Save) return `${message.words.join(', ')} <em>${message.score}pts</em>`;
  if (message.type === TurnOutcomeType.Pass) return '<em>passed</em>';
  return '';
}
</script>

<template>
  <ul v-if="messages.length > 0" class="annotation">
    <li v-for="(message, idx) in messages" :key="idx" v-html="convertMessageToHtml(message)" />
  </ul>
</template>

<style lang="scss" scoped>
.annotation {
  color: var(--color-gray-light);
  height: 6rem;
  border-left: 1px solid var(--color-gray-light);
  padding-left: calc(var(--cell-tile-width) / 4);
  padding-right: calc(var(--cell-tile-width) / 2);
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  font-size: var(--font-size-small);
  overflow-y: auto;
  :deep(em) {
    font-style: italic;
  }
}
</style>
