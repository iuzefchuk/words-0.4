<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { reactive } from 'vue';
import AppButton from '@/interface/components/shared/AppButton/AppButton.vue';
import UseEventHandlers from '@/interface/composables/UseEventHandlers.ts';
import { Accent } from '@/interface/enums.ts';
import MainStore from '@/interface/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
const eventHandlers = new UseEventHandlers();
const { allActionsAreDisabled } = storeToRefs(mainStore);
const items = reactive([
  {
    accent: Accent.Primary,
    action: () => {
      eventHandlers.handleSave();
    },
    isDisabled: () => allActionsAreDisabled.value || !mainStore.currentTurnIsValid,
    keys: ['Enter'],
    name: window.text('general.action_play'),
  },
  {
    accent: Accent.Secondary,
    action: () => {
      void eventHandlers.handlePass();
    },
    isDisabled: () => allActionsAreDisabled.value,
    keys: ['p'],
    name: window.text('general.action_pass'),
  },
  {
    accent: Accent.Secondary,
    action: () => {
      void eventHandlers.handleResign();
    },
    isDisabled: () => allActionsAreDisabled.value,
    keys: ['r'],
    name: window.text('general.action_resign'),
  },
]);
</script>

<template>
  <div class="toolbar" role="toolbar" :aria-label="text('general.aria_footer_toolbar')">
    <AppButton
      v-for="{ name, action, accent, isDisabled, keys } in items"
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
  }
}
</style>
