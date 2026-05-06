<script lang="ts" setup>
import MainFooterActions from '@/interface/components/by-hierarchy/Main/MainFooter/MainFooterActions.vue';
import MainFooterRack from '@/interface/components/by-hierarchy/Main/MainFooter/MainFooterRack.vue';
</script>

<template>
  <footer class="footer">
    <Transition name="fade-from-bottom" appear>
      <MainFooterRack class="footer__top" />
    </Transition>
    <Transition name="fade-from-right" appear>
      <MainFooterActions class="footer__bottom" />
    </Transition>
  </footer>
</template>

<style lang="scss" scoped>
.footer {
  width: 100%;
  display: grid;
  grid-template-columns: 1px 2fr 1px;
  grid-template-rows: auto;
  align-items: center;
  overflow-x: hidden;
  &__top {
    grid-column: 2;
    align-self: flex-start;
    justify-self: center;
  }
  &__bottom {
    grid-column: 3;
    justify-self: end;
    align-self: end;
  }
}
</style>
