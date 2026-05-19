<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import LayoutHeaderSetup from '@/interface/components/by-hierarchy/Layout/LayoutHeader/LayoutHeaderSetup.vue';
import LayoutHeaderStats from '@/interface/components/by-hierarchy/Layout/LayoutHeader/LayoutHeaderStats.vue';
import MainStore from '@/interface/stores/MainStore/MainStore.ts';
const { settingsChangeIsAllowed } = storeToRefs(MainStore.INSTANCE());
</script>

<template>
  <header class="header">
    <Transition name="fade-from-top" mode="out-in" appear>
      <LayoutHeaderSetup v-if="settingsChangeIsAllowed" />
      <LayoutHeaderStats v-else />
    </Transition>
  </header>
</template>

<style lang="scss" scoped>
.header {
  width: 100%;
}
</style>
