<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import LayoutAnnotation from '@/interface/components/by-hierarchy/Layout/LayoutAnnotation.vue';
import LayoutBanner from '@/interface/components/by-hierarchy/Layout/LayoutBanner.vue';
import LayoutFooter from '@/interface/components/by-hierarchy/Layout/LayoutFooter/LayoutFooter.vue';
import LayoutGrid from '@/interface/components/by-hierarchy/Layout/LayoutGrid/LayoutGrid.vue';
import LayoutHeader from '@/interface/components/by-hierarchy/Layout/LayoutHeader/LayoutHeader.vue';
import LayoutRestart from '@/interface/components/by-hierarchy/Layout/LayoutRestart.vue';
import { Key, LabeledElement } from '@/interface/enums.ts';
import { getElementLabel } from '@/interface/mappings.ts';
import DialogStore from '@/interface/stores/DialogStore.ts';
import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';
await MainStore.initiate();
const mainStore = MainStore.INSTANCE();
const { matchIsFinished } = storeToRefs(mainStore);
const userStore = UserStore.INSTANCE();
const dialogStore = DialogStore.INSTANCE();
const isMounted = ref(false);
onMounted(() => nextTick(() => (isMounted.value = true)));
function onKeydown(event: KeyboardEvent): void {
  if ((event.key as Key) !== Key.Escape) return;
  if (dialogStore.isOpen) return;
  userStore.deselectTile();
}
onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <div
    v-if="isMounted"
    :style="{ '--grid-items-per-axis': mainStore.boardCellsPerAxis }"
    :class="{ layout: true, 'layout--blurred': matchIsFinished }"
    @click="userStore.deselectTile()"
  >
    <h1 class="app__make-sr-only">{{ getElementLabel(LabeledElement.Layout) }}</h1>
    <LayoutHeader class="layout__top" />
    <div class="layout__mid app__limit-max-width">
      <LayoutAnnotation class="layout__mid-annotation" />
      <LayoutGrid />
    </div>
    <LayoutFooter class="layout__bottom" />
  </div>
  <LayoutBanner />
  <Transition name="fade" appear>
    <LayoutRestart v-if="matchIsFinished" />
  </Transition>
</template>

<style lang="scss" scoped>
.layout {
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
  justify-items: center;
  &__top,
  &__bottom {
    padding: var(--layout-padding);
  }
  &__top {
    align-self: flex-start;
    justify-self: flex-start;
  }
  &__mid {
    position: relative;
    width: 100%;
    display: grid;
    place-items: center;
  }
  &__mid-annotation {
    position: absolute;
    top: calc(var(--layout-annotation-height) * -1 - var(--layout-padding));
    right: 0rem;
  }
  &__bottom {
    justify-self: center;
    align-self: end;
  }
  &--blurred {
    filter: blur(1rem);
    opacity: 0.5;
  }
}
</style>
