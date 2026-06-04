<script lang="ts" setup>
import LayoutMainGrid from '@/interface/components/by-hierarchy/Layout/LayoutMain/LayoutMainGrid/LayoutMainGrid.vue';
import LayoutMainLog from '@/interface/components/by-hierarchy/Layout/LayoutMain/LayoutMainLog.vue';
</script>

<template>
  <main class="main">
    <LayoutMainLog class="main__log" />
    <LayoutMainGrid />
  </main>
</template>

<style lang="scss" scoped>
@use '@style/breakpoints.scss' as *;

.main {
  width: 100%;
  position: relative;
  max-width: $breakpoint-mobile;

  &__log {
    position: absolute;
    top: calc(var(--layout-main-log-height) * -1 - var(--layout-padding));
    right: var(--layout-padding);
  }
}
</style>
