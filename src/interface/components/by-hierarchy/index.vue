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
@use '@/interface/assets/css/adjustments.scss';
@use '@/interface/assets/css/animations.scss';
@use '@/interface/assets/css/general.scss';
@use '@/interface/assets/css/colors.scss';
@use '@/interface/assets/css/transitions.scss';
@use '@/interface/assets/css/variables.scss';
</style>
