<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import LayoutFooter from '@/interface/components/by-hierarchy/Layout/LayoutFooter/LayoutFooter.vue';
import LayoutHeader from '@/interface/components/by-hierarchy/Layout/LayoutHeader/LayoutHeader.vue';
import LayoutMain from '@/interface/components/by-hierarchy/Layout/LayoutMain/LayoutMain.vue';
import LayoutRestart from '@/interface/components/by-hierarchy/Layout/LayoutRestart.vue';
import { Key } from '@/interface/enums.ts';
import useLocalesNamespace from '@/interface/composables/UseLocalesNamespace.ts';
import DialogStore from '@/interface/stores/DialogStore.ts';
import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';
const { ready: localeReady } = useLocalesNamespace('game');
await MainStore.initiate();
const mainStore = MainStore.INSTANCE();
const { matchIsFinished } = storeToRefs(mainStore);
const userStore = UserStore.INSTANCE();
const dialogStore = DialogStore.INSTANCE();
const isMounted = ref(false);

// TODO to composable
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

onMounted(() => nextTick(() => (isMounted.value = true)));
</script>

<template>
  <div
    v-if="isMounted && localeReady"
    :style="{ '--grid-items-per-axis': mainStore.boardCellsPerAxis }"
    :class="{ layout: true, 'layout--blurred': matchIsFinished }"
    @click="userStore.deselectTile()"
  >
    <h1 class="app__make-sr-only">Words</h1>
    <LayoutHeader class="layout__top" />
    <LayoutMain class="layout__mid" />
    <LayoutFooter class="layout__bottom" />
  </div>
  <Transition name="fade" appear>
    <LayoutRestart v-if="matchIsFinished" />
  </Transition>
</template>

<style lang="scss" scoped>
@use '@style/breakpoints.scss' as *;

.layout {
  transition-property: opacity;
  transition-duration: var(--transition-duration);
  transition-timing-function: var(--transition-timing-function);
  width: 100%;
  min-height: 100vh;
  height: 100vh;
  max-height: 100vh;
  gap: var(--space-s);
  display: grid;
  grid-template-rows: 1fr auto 1fr;
  place-items: center center;

  &__top,
  &__mid {
    padding: var(--layout-padding);
  }

  &__top {
    place-self: flex-start flex-start;
  }

  &__bottom {
    place-self: stretch center;
  }

  &--blurred {
    opacity: 0.5;
  }
}
</style>
