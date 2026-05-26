<script lang="ts" setup>
defineProps<{ html: string }>();
</script>

<template>
  <div class="alert" role="alert"><p v-html="html" /></div>
</template>

<style lang="scss" scoped>
.alert {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  width: 100vh;
  padding: var(--layout-padding);
  background: var(--alert-bg);
  color: var(--alert-color);
  z-index: var(--z-index-level-3);
  display: grid;
  place-items: center;
  :deep(em) {
    font-style: italic;
  }
}
</style>
