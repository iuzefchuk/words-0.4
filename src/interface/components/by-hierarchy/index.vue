<script lang="ts" setup>
import Dialog from '@/interface/components/by-hierarchy/Dialog/Dialog.vue';
import Layout from '@/interface/components/by-hierarchy/Layout/Layout.vue';
import Loader from '@/interface/components/by-hierarchy/Loader/Loader.vue';
</script>

<template>
  <Suspense>
    <Layout />
    <template #fallback><Loader /></template>
  </Suspense>
  <Dialog />
</template>

<style lang="scss">
@use '@/interface/assets/scss/reset.scss';
@use '@/interface/assets/scss/animations.scss';
@use '@/interface/assets/scss/transitions.scss';
@use '@/interface/assets/scss/base.scss';
@use '@/interface/assets/scss/utilities.scss';
@use '@/interface/assets/scss/tokens' as tokens;
@use '@/interface/assets/scss/themes' as themes;
:root {
  @include tokens.emit;
  @include themes.emit;
}
</style>
