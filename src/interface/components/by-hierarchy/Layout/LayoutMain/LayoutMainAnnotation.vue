<script lang="ts" setup>
import UseHistory from '@/interface/composables/UseHistory/UseHistory.ts';
import { LabeledElement } from '@/interface/enums.ts';
import { getElementLabel } from '@/interface/mappings.ts';
const { history } = new UseHistory();
</script>

<template>
  <aside
    v-if="history.length > 0"
    class="annotation"
    role="log"
    aria-live="polite"
    aria-relevant="additions"
    :aria-label="getElementLabel(LabeledElement.LayoutAnnotation)"
  >
    <TransitionGroup name="fade-from-left" tag="ul" class="annotation__list app__make-secondary" appear>
      <li v-for="{ key, html } in history" :key="key" v-html="html" />
    </TransitionGroup>
  </aside>
</template>

<style lang="scss" scoped>
.annotation {
  $padding-right: var(--layout-padding);
  width: calc(100% - $padding-right);
  &__list {
    height: var(--layout-annotation-height);
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
