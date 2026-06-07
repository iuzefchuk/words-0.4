<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import Alert from '@/interface/components/by-hierarchy/Alert.vue';
import Dialog from '@/interface/components/by-hierarchy/Dialog.vue';
import Layout from '@/interface/components/by-hierarchy/Layout/Layout.vue';
import Progress from '@/interface/components/by-hierarchy/Progress.vue';
import MainStore from '@/interface/stores/MainStore.ts';
const { bootError } = storeToRefs(MainStore.INSTANCE());
</script>

<template>
  <Alert v-if="bootError" :html="text('general.boot_error', { error: bootError })" />
  <Suspense v-else>
    <Layout />
    <template #fallback><Progress /></template>
  </Suspense>
  <Dialog />
</template>

<style lang="scss">
@use '../../assets/style/reset';
@use '../../assets/style/animations';
@use '../../assets/style/transitions';
@use '../../assets/style/base';
@use '../../assets/style/utilities';
@use '../../assets/style/tokens' as tokens;
@use '../../assets/style/themes' as themes;

:root {
  @include tokens.emit;
  @include themes.emit;
}
</style>
