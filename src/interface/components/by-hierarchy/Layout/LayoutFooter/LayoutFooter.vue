<script lang="ts" setup>
import LayoutFooterRack from '@/interface/components/by-hierarchy/Layout/LayoutFooter/LayoutFooterRack/LayoutFooterRack.vue';
import LayoutFooterToolbar from '@/interface/components/by-hierarchy/Layout/LayoutFooter/LayoutFooterToolbar.vue';
</script>

<template>
  <footer class="footer">
    <Transition name="fade-from-bottom" appear>
      <LayoutFooterRack class="footer__top" />
    </Transition>
    <Transition name="fade-from-right" appear>
      <LayoutFooterToolbar class="footer__bottom" />
    </Transition>
  </footer>
</template>

<style lang="scss" scoped>
@use '@style/breakpoints.scss' as *;
.footer {
  width: 100%;
  display: grid;
  grid-template-columns: 1px 2fr 1px;
  grid-template-rows: auto;
  align-items: center;
  overflow-x: hidden;
  @media screen and (max-width: $breakpoint-mobile) {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(2, 1fr);
  }
  &__top {
    grid-column: 2;
    align-self: flex-start;
    justify-self: center;
    @media screen and (max-width: $breakpoint-mobile) {
      grid-column: 1;
    }
  }
  &__bottom {
    grid-column: 3;
    justify-self: end;
    align-self: end;
    @media screen and (max-width: $breakpoint-mobile) {
      grid-column: 1;
      width: 100%;
    }
  }
}
</style>
