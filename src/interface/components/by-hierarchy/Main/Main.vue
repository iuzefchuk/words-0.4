<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { nextTick, onMounted, ref } from 'vue';
import MainEndscreen from '@/interface/components/by-hierarchy/Main/MainEndscreen.vue';
import MainFeed from '@/interface/components/by-hierarchy/Main/MainFeed.vue';
import MainFooter from '@/interface/components/by-hierarchy/Main/MainFooter/MainFooter.vue';
import MainHeader from '@/interface/components/by-hierarchy/Main/MainHeader/MainHeader.vue';
import MainPlayfield from '@/interface/components/by-hierarchy/Main/MainPlayfield/MainPlayfield.vue';
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
    :class="{ main: true, 'main--blurred': matchIsFinished }"
    @click="userStore.deselectTile()"
  >
    <MainHeader class="main__top" />
    <main class="main__mid">
      <MainFeed class="main__mid-feed" />
      <MainPlayfield />
    </main>
    <MainFooter class="main__bottom" />
  </div>
  <Transition name="fade" appear>
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
  justify-items: center;
  &__top,
  &__mid,
  &__bottom {
    padding: var(--main-padding);
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
  &__mid-feed {
    position: absolute;
    top: calc(var(--main-feed-height) * -1 - var(--main-padding));
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
