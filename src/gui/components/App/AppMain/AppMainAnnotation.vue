<script lang="ts" setup>
import { computed } from 'vue';
import MatchStore from '@/gui/stores/MatchStore.ts';
const MAX_LENGTH = 3;
const matchStore = MatchStore.INSTANCE();
const messages = computed(() => {
  const history = matchStore.outcomeHistory;
  const start = Math.max(0, history.length - MAX_LENGTH);
  return history.slice(start).map((message, i) => ({
    ...('words' in message && { words: message.words, score: message.score }),
    key: start + i,
  }));
});
function convertMessageToHtml(words: ReadonlyArray<string> | undefined, score: number | undefined): string {
  if (words && score) return `<em>${words.join(', ')}</em> for ${score}pts`;
  else return 'passed';
}
</script>

<template>
  <TransitionGroup v-if="messages.length > 0" name="fade-from-left" tag="ul" class="annotation" appear>
    <li v-for="{ words, score, key } in messages" :key="key" v-html="convertMessageToHtml(words, score)" />
  </TransitionGroup>
</template>

<style lang="scss" scoped>
.annotation {
  color: var(--secondary-color);
  height: 6rem;
  border-left: 1px solid var(--secondary-color);
  padding-left: calc(var(--cell-tile-width) / 4);
  padding-right: calc(var(--cell-tile-width) / 2);
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  font-size: var(--font-size-small);
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  :deep(em) {
    font-style: italic;
  }
}
</style>
