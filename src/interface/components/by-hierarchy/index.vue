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
@use '@/interface/assets/scss/adjustments.scss';
@use '@/interface/assets/scss/animations.scss';
@use '@/interface/assets/scss/general.scss';
@use '@/interface/assets/scss/transitions.scss';
@use '@/interface/assets/scss/variables/general.scss' as variables;
@use '@/interface/assets/scss/variables/colors.scss';
:root {
  @include light-theme;
  @media (prefers-color-scheme: dark) {
    @include dark-theme;
  }
}
</style>
