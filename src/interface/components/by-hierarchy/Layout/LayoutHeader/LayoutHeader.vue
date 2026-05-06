<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import LayoutHeaderScore from '@/interface/components/by-hierarchy/Layout/LayoutHeader/LayoutHeaderScore.vue';
import LayoutHeaderSetup from '@/interface/components/by-hierarchy/Layout/LayoutHeader/LayoutHeaderSetup.vue';
import MainStore from '@/interface/stores/MainStore.ts';
const { settingsChangeIsAllowed } = storeToRefs(MainStore.INSTANCE());
</script>

<template>
  <header class="header">
    <Transition name="fade-from-top" mode="out-in" appear>
      <LayoutHeaderSetup v-if="settingsChangeIsAllowed" />
      <LayoutHeaderScore v-else />
    </Transition>
  </header>
</template>

<style lang="scss" scoped>
.header {
  width: 100%;
}
</style>
