<script lang="ts" setup>
import Dialog from '@/presentation/components/by-hierarchy/Dialog.vue';
import Loader from '@/presentation/components/by-hierarchy/Loader.vue';
import Main from '@/presentation/components/by-hierarchy/Main/Main.vue';
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
@use '@/presentation/assets/css/adjustments.scss';
@use '@/presentation/assets/css/animations.scss';
@use '@/presentation/assets/css/app.scss';
@use '@/presentation/assets/css/colors.scss';
@use '@/presentation/assets/css/transitions.scss';
@use '@/presentation/assets/css/variables.scss';
</style>
