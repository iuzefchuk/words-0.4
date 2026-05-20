<script lang="ts" setup>
import UseHistory from '@/interface/composables/UseHistory.ts';
const { history } = new UseHistory();
</script>

<template>
  <aside v-if="history.length > 0" class="log" role="log">
    <TransitionGroup name="fade-from-left" tag="ul" class="log__list app__make-secondary" appear>
      <li v-for="{ key, html } in history" :key="key" v-html="html" />
    </TransitionGroup>
  </aside>
</template>

<style lang="scss" scoped>
.log {
  $padding-right: var(--layout-padding);
  width: calc(100% - $padding-right);
  &__list {
    height: var(--layout-main-log-height);
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
