<script lang="ts" setup>
import LayoutMainAnnotation from '@/interface/components/by-hierarchy/Layout/LayoutMain/LayoutMainAnnotation.vue';
import LayoutMainGrid from '@/interface/components/by-hierarchy/Layout/LayoutMain/LayoutMainGrid/LayoutMainGrid.vue';
import { LabeledElement } from '@/interface/enums.ts';
import { getElementLabel } from '@/interface/mappings.ts';
</script>
<template>
  <main class="main" :aria-label="getElementLabel(LabeledElement.LayoutGrid)">
    <LayoutMainAnnotation class="main__annotation" />
    <LayoutMainGrid />
  </main>
</template>

<style lang="scss" scoped>
@use '@style/breakpoints.scss' as *;
.main {
  width: 100%;
  position: relative;
  max-width: $breakpoint-mobile;
  &__annotation {
    position: absolute;
    top: calc(var(--layout-annotation-height) * -1 - var(--layout-padding));
    right: var(--layout-padding);
  }
}
</style>
