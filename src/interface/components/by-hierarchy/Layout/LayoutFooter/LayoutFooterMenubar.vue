<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { reactive } from 'vue';
import AppButton from '@/interface/components/app/AppButton.vue';
import { Accent, Key } from '@/interface/enums.ts';
import { handlePass, handleResign, handleSave } from '@/interface/handlers/menubar.ts';
import MainStore from '@/interface/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
const { allActionsAreDisabled } = storeToRefs(mainStore);
const buttons = reactive([
  {
    accent: Accent.Primary,
    action: () => {
      handleSave();
    },
    isDisabled: () => allActionsAreDisabled.value || !mainStore.currentTurnIsValid,
    keys: [Key.Enter],
    name: window.text('general.action_play'),
  },
  {
    accent: Accent.Secondary,
    action: () => {
      void handlePass();
    },
    isDisabled: () => allActionsAreDisabled.value,
    keys: [Key.P],
    name: window.text('general.action_pass'),
  },
  {
    accent: Accent.Secondary,
    action: () => {
      void handleResign();
    },
    isDisabled: () => allActionsAreDisabled.value,
    // TODO disable key controls on endscreen
    keys: [Key.R],
    name: window.text('general.action_resign'),
  },
]);
</script>

<template>
  <section class="menubar" role="menubar" aria-label="Match actions">
    <AppButton
      v-for="{ name, action, accent, isDisabled, keys } in buttons"
      :key="name"
      :accent="accent"
      :is-disabled="isDisabled()"
      :keys="keys"
      :text="name"
      @trigger="action()"
    />
  </section>
</template>

<style lang="scss" scoped>
@use '@style/breakpoints.scss' as *;

.menubar {
  z-index: var(--z-index-level-1);
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding: var(--layout-padding);

  @media screen and (max-width: $breakpoint-mobile) {
    flex-direction: row-reverse;
  }
}
</style>
