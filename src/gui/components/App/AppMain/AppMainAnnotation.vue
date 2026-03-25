<script lang="ts" setup>
import UseAnnotation from '@/gui/composables/UseAnnotation.ts';
const { messages } = new UseAnnotation();
</script>

<template>
  <TransitionGroup v-if="messages.length > 0" name="fade-from-right" tag="ul" class="annotation" appear>
    <li v-for="{ key, html } in messages" :key="key" v-html="html" />
  </TransitionGroup>
</template>

<style lang="scss" scoped>
.annotation {
  $padding-right: calc(var(--cell-tile-width) / 4);
  height: 6rem;
  border-right: 1px solid var(--secondary-color);
  padding-right: $padding-right;
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  color: var(--secondary-color);
  font-size: var(--font-size-small);
  overflow-y: auto;
  overflow-x: hidden;
  width: calc(100% - $padding-right);
  text-align: right;
  :deep(em) {
    font-style: italic;
  }
}
</style>
