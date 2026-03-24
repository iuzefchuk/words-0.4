<script lang="ts" setup>
import UseAnnotation from '@/gui/composables/UseAnnotation.ts';
const { messages } = new UseAnnotation();
</script>

<template>
  <TransitionGroup v-if="messages.length > 0" name="fade-from-left" tag="ul" class="annotation" appear>
    <li v-for="{ key, html } in messages" :key="key" v-html="html" />
  </TransitionGroup>
</template>

<style lang="scss" scoped>
.annotation {
  height: 6rem;
  border-left: 1px solid var(--secondary-color);
  padding-left: calc(var(--cell-tile-width) / 4);
  padding-right: calc(var(--cell-tile-width) / 2);
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  color: var(--secondary-color);
  font-size: var(--font-size-small);
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  :deep(em) {
    font-style: italic;
  }
}
</style>
