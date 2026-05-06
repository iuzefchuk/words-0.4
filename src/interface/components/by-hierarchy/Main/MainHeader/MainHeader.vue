<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import MainHeaderError from '@/interface/components/by-hierarchy/Main/MainHeader/MainHeaderError.vue';
import MainHeaderScoreline from '@/interface/components/by-hierarchy/Main/MainHeader/MainHeaderScoreline.vue';
import MainHeaderSettings from '@/interface/components/by-hierarchy/Main/MainHeader/MainHeaderSettings.vue';
import MainStore from '@/interface/stores/MainStore.ts';
const { settingsChangeIsAllowed } = storeToRefs(MainStore.INSTANCE());
</script>

<template>
  <header class="header">
    <Transition name="fade-from-top" appear>
      <MainHeaderError />
    </Transition>
    <Transition name="fade" mode="out-in" appear>
      <MainHeaderSettings v-if="settingsChangeIsAllowed" />
      <MainHeaderScoreline v-else />
    </Transition>
  </header>
</template>

<style lang="scss" scoped>
.header {
  width: 100%;
  padding: var(--main-padding) 0;
}
</style>
