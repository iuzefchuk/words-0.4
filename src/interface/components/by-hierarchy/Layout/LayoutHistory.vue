<script lang="ts" setup>
import UseHistory from '@/interface/composables/UseHistory.ts';
const { history } = new UseHistory();
</script>

<template>
  <aside v-if="history.length > 0" class="history" role="log" :aria-label="text('general.aria_layout_history')">
    <TransitionGroup name="fade-from-left" tag="ul" class="history__list app__make-secondary" appear>
      <li v-for="{ key, html } in history" :key="key" v-html="html" />
    </TransitionGroup>
  </aside>
</template>

<style lang="scss" scoped>
.history {
  $padding-right: calc(var(--grid-item-size) / 4);
  width: calc(100% - $padding-right);
  &__list {
    height: var(--layout-history-height);
    border-right: 1px solid currentColor;
    padding-right: $padding-right;
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
    overflow-y: auto;
    overflow-x: hidden;
    text-align: right;
    :deep(em) {
      font-style: italic;
    }
  }
}
</style>
