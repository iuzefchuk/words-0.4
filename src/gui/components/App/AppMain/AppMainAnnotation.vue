<script lang="ts" setup>
import { computed } from "vue";
import { TurnOutcomeType, type TurnOutcome } from "@/domain/models/TurnTracker.ts"; // TODO fix
import MatchStore from "@/gui/stores/MatchStore.ts";
const MAX_LENGTH = 3;
const matchStore = MatchStore.INSTANCE();
const messages = computed(() => {
  const history = matchStore.outcomeHistory;
  const start = Math.max(0, history.length - MAX_LENGTH);
  return history.slice(start).map((message, i) => ({ message, key: start + i }));
});
function convertMessageToHtml(message: TurnOutcome): string {
  if (message.type === TurnOutcomeType.Save) return `${message.words.join(", ")} <em>${message.score}pts</em>`;
  if (message.type === TurnOutcomeType.Pass) return "<em>passed</em>";
  return "";
}
</script>

<template>
  <TransitionGroup name="fade-from-left" tag="ul" v-if="messages.length > 0" class="annotation" appear>
    <li v-for="{ message, key } in messages" :key="key" v-html="convertMessageToHtml(message)" />
  </TransitionGroup>
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
  overflow-x: hidden;
  width: 100%;
  :deep(em) {
    font-style: italic;
  }
}
</style>
