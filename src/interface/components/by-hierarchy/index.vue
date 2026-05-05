<script lang="ts" setup>
import Dialog from '@/interface/components/by-hierarchy/Dialog.vue';
import Loader from '@/interface/components/by-hierarchy/Loader.vue';
import Main from '@/interface/components/by-hierarchy/Main/Main.vue';
</script>

<template>
  <Suspense>
    <Main />
    <template #fallback><Loader /></template>
  </Suspense>
  <Transition name="fade" appear>
    <Dialog />
  </Transition>
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
