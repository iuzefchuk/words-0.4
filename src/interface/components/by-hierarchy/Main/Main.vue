<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { nextTick, onMounted, ref } from 'vue';
import MainAnnotation from '@/interface/components/by-hierarchy/Main/MainAnnotation.vue';
import MainBanner from '@/interface/components/by-hierarchy/Main/MainBanner.vue';
import MainBoard from '@/interface/components/by-hierarchy/Main/MainBoard/MainBoard.vue';
import MainEndscreen from '@/interface/components/by-hierarchy/Main/MainEndscreen.vue';
import MainFooter from '@/interface/components/by-hierarchy/Main/MainFooter/MainFooter.vue';
import MainHeader from '@/interface/components/by-hierarchy/Main/MainHeader.vue';
import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';
await MainStore.initiate();
const mainStore = MainStore.INSTANCE();
const { matchIsFinished } = storeToRefs(mainStore);
const userStore = UserStore.INSTANCE();
const isMounted = ref(false);
onMounted(() => nextTick(() => (isMounted.value = true)));
</script>

<template>
  <MainBanner />
  <main
    :style="{ '--cell-count-per-axis': mainStore.boardCellsPerAxis }"
    :class="{ main: true, 'main--blurred': matchIsFinished }"
    @click="userStore.deselectTile()"
  >
    <Transition name="fade-down-up">
      <MainHeader v-if="isMounted" />
    </Transition>
    <div class="main__center app__limit-max-width">
      <MainAnnotation class="main__center-annotation" />
      <MainBoard />
    </div>
    <Transition name="fade-up-down">
      <MainFooter v-if="isMounted" />
    </Transition>
  </main>
  <Transition name="fade">
    <MainEndscreen v-if="matchIsFinished" />
  </Transition>
</template>

<style lang="scss" scoped>
.main {
  transition-property: filter, opacity;
  transition-duration: var(--transition-duration);
  transition-timing-function: var(--transition-timing-function);
  width: 100%;
  min-height: 100vh;
  height: 100vh;
  max-height: 100vh;
  gap: var(--space-s);
  display: grid;
  grid-template-rows: 1fr auto 1fr;
  align-items: center;
  padding-left: var(--primary-padding);
  padding-right: var(--primary-padding);
  justify-items: center;
  &__center {
    position: relative;
  }
  &__center-annotation {
    position: absolute;
    top: -7rem;
  }
  &--blurred {
    filter: blur(0.5rem);
    opacity: var(--opacity-disabled);
  }
}
</style>
