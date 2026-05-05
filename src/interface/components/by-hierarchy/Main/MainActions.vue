<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { reactive } from 'vue';
import AppButton from '@/interface/components/shared/AppButton/AppButton.vue';
import UseEventHandlers from '@/interface/composables/UseEventHandlers.ts';
import { Accent } from '@/interface/enums.ts';
import MainStore from '@/interface/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
const eventHandlers = UseEventHandlers.create();
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
    isRendered: () => true,
    keys: ['p'],
    name: window.text('general.action_pass'),
  },
  {
    accent: Accent.Secondary,
    action: () => {
      void eventHandlers.handleResign();
    },
    isDisabled: () => allActionsAreDisabled.value,
    isRendered: () => true,
    keys: ['r'],
    name: window.text('general.action_resign'),
  },
]);
</script>

<template>
  <section class="actions">
    <ul class="actions__list">
      <li v-for="{ name, action, accent, isDisabled, keys } in items" :key="name">
        <AppButton class="actions__btn" :accent="accent" :is-disabled="isDisabled()" :keys="keys" @click="action()">
          {{ name }}
        </AppButton>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.actions {
  &__list {
    z-index: var(--z-index-level-1);
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
    @media screen and (max-width: 750px) {
      flex-direction: row-reverse;
      padding-top: calc(var(--rack-height) + var(--primary-space));
    }
  }
}
</style>
