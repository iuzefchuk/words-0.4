<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { nextTick, onMounted, ref } from 'vue';
import LayoutError from '@/interface/components/by-hierarchy/Layout/LayoutError.vue';
import LayoutField from '@/interface/components/by-hierarchy/Layout/LayoutField/LayoutField.vue';
import LayoutFooter from '@/interface/components/by-hierarchy/Layout/LayoutFooter/LayoutFooter.vue';
import LayoutHeader from '@/interface/components/by-hierarchy/Layout/LayoutHeader/LayoutHeader.vue';
import LayoutHistory from '@/interface/components/by-hierarchy/Layout/LayoutHistory.vue';
import LayoutRestart from '@/interface/components/by-hierarchy/Layout/LayoutRestart.vue';
import { LabeledElement } from '@/interface/enums.ts';
import { getElementLabel } from '@/interface/mappings.ts';
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
  <div
    v-if="isMounted"
    :style="{ '--grid-items-per-axis': mainStore.boardCellsPerAxis }"
    :class="{ layout: true, 'layout--blurred': matchIsFinished }"
    @click="userStore.deselectTile()"
  >
    <h1 class="app__make-sr-only">{{ getElementLabel(LabeledElement.Layout) }}</h1>
    <LayoutHeader class="layout__top" />
    <div class="layout__mid app__limit-max-width">
      <LayoutHistory class="layout__mid-history" />
      <LayoutField />
    </div>
    <LayoutFooter class="layout__bottom" />
  </div>
  <LayoutError />
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
  &__mid-history {
    position: absolute;
    top: calc(var(--layout-history-height) * -1 - var(--layout-padding));
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
