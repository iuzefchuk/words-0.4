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
  <main
    v-if="isMounted"
    :style="{ '--grid-items-per-axis': mainStore.boardCellsPerAxis }"
    :class="{ main: true, 'main--blurred': matchIsFinished }"
    @click="userStore.deselectTile()"
  >
    <MainHeader class="main__top" />
    <div class="main__mid app__limit-max-width">
      <MainFeed class="main__mid-feed" />
      <MainPlayfield />
    </div>
    <MainFooter class="main__bottom" />
  </main>
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
  padding-left: var(--main-padding);
  padding-right: var(--main-padding);
  justify-items: center;
  &__top {
    align-self: flex-start;
    justify-self: flex-start;
  }
  &__mid {
    position: relative;
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
