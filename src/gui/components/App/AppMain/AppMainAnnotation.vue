<script lang="ts" setup>
const messages: ReadonlyArray<{ text: string; words: ReadonlyArray<string> }> = [
  {
    text: 'You player FOO for 34 pts',
    words: ['FOO'],
  },
];
function convertMessageToHtml(message: { text: string; words: ReadonlyArray<string> }): string {
  const result = message.text;
  message.words.forEach(word => {
    result.replaceAll(word, `<em>${word}</em>`);
  });
  return result;
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
