<script lang="ts" setup>
import AppMainFooterButtons from '@/gui/components/App/AppMain/AppMainFooter/AppMainFooterButtons.vue';
import AppMainFooterRack from '@/gui/components/App/AppMain/AppMainFooter/AppMainFooterRack.vue';
</script>

<template>
  <footer class="footer">
    <AppMainFooterRack />
    <AppMainFooterButtons />
  </footer>
</template>

<style lang="scss" scoped>
.footer {
  justify-self: center;
  align-self: end;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-m);
  width: 100%;
  margin-bottom: var(--space-l);
}
</style>
