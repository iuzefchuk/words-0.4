<script lang="ts" setup>
import Dialog from '@/interface/components/by-hierarchy/Dialog.vue';
import Layout from '@/interface/components/by-hierarchy/Layout/Layout.vue';
import Loader from '@/interface/components/by-hierarchy/Loader.vue';
</script>

<template>
  <Suspense>
    <Layout />
    <template #fallback><Loader /></template>
  </Suspense>
  <Dialog />
</template>

<style lang="scss">
@use '@style/reset.scss';
@use '@style/animations.scss';
@use '@style/transitions.scss';
@use '@style/base.scss';
@use '@style/utilities.scss';
@use '@style/tokens' as tokens;
@use '@style/themes' as themes;
:root {
  @include tokens.emit;
  @include themes.emit;
}
</style>
