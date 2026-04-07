<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { inject, onMounted, ref, watch } from 'vue';
import Dialog from '@/gui/components/by-hierarchy/Dialog/Dialog.vue';
import Endscreen from '@/gui/components/by-hierarchy/Endscreen.vue';
import Loader from '@/gui/components/by-hierarchy/Loader/Loader.vue';
import Main from '@/gui/components/by-hierarchy/Main/Main.vue';
import ProvidesPlugin from '@/gui/plugins/ProvidesPlugin.ts';
import MainStore from '@/gui/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
const { matchIsFinished } = storeToRefs(mainStore);
const loaderIsActive = ref(true);
const mainIsRendered = ref(false);
const showEndscreen = ref(false);
const transitionDurationMs = inject(ProvidesPlugin.TRANSITION_DURATION_MS_KEY);
watch(matchIsFinished, finished => {
  if (finished) showEndscreen.value = true;
});
onMounted(() => {
  loaderIsActive.value = false;
});
</script>

<template>
  <div
    :class="{ app: true, 'app--blurred': showEndscreen }"
    :style="{
      ...(transitionDurationMs && {
        '--transition-duration': `${transitionDurationMs}ms`,
        '--transition-duration-half': `${transitionDurationMs / 2}ms`,
      }),
      '--cell-count-per-axis': mainStore.boardCellsPerAxis,
    }"
  >
    <Loader :is-active="loaderIsActive" @derendered="mainIsRendered = true" />
    <Main v-if="mainIsRendered" />
    <Dialog />
  </div>
  <Transition name="fade" appear>
    <Endscreen v-if="showEndscreen" />
  </Transition>
</template>

<style lang="scss">
@use '@/gui/assets/css/adjustments.scss';
@use '@/gui/assets/css/animations.scss';
@use '@/gui/assets/css/app.scss';
@use '@/gui/assets/css/colors.scss';
@use '@/gui/assets/css/transitions.scss';
@use '@/gui/assets/css/variables.scss';
</style>
