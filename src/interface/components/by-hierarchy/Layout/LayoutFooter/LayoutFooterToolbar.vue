<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { reactive } from 'vue';
import AppButton from '@/interface/components/app/AppButton.vue';
import { Accent, Key, LabeledElement } from '@/interface/enums.ts';
import { handlePass, handleResign, handleSave } from '@/interface/handlers/toolbar/toolbar.ts';
import { getElementLabel } from '@/interface/mappings.ts';
import MainStore from '@/interface/stores/MainStore/MainStore.ts';
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
    keys: [Key.R],
    name: window.text('general.action_resign'),
  },
]);
</script>

<template>
  <div class="toolbar" role="toolbar" :aria-label="getElementLabel(LabeledElement.LayoutFooterToolbar)">
    <AppButton
      v-for="{ name, action, accent, isDisabled, keys } in buttons"
      :key="name"
      :accent="accent"
      :is-disabled="isDisabled()"
      :keys="keys"
      @trigger="action()"
    >
      {{ name }}
    </AppButton>
  </div>
</template>

<style lang="scss" scoped>
.toolbar {
  z-index: var(--z-index-level-1);
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  @media screen and (max-width: 750px) {
    flex-direction: row-reverse;
    padding-top: 5rem;
  }
}
</style>
