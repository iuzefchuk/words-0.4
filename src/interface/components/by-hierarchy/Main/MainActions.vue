<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { reactive } from 'vue';
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
    name: window.text('game.action_play'),
  },
  {
    accent: Accent.Secondary,
    action: () => {
      void eventHandlers.handlePass();
    },
    isDisabled: () => allActionsAreDisabled.value,
    isRendered: () => true,
    name: window.text('game.action_pass'),
  },
  {
    accent: Accent.Secondary,
    action: () => {
      void eventHandlers.handleResign();
    },
    isDisabled: () => allActionsAreDisabled.value,
    isRendered: () => true,
    name: window.text('game.action_resign'),
  },
  // {
  //   accent: Accent.Secondary,
  //   action: () => {
  //     eventHandlers.handleShuffle();
  //   },
  //   isDisabled: () => allActionsAreDisabled.value,
  //   name: window.text('game.action_shuffle'),
  // },
  // {
  //   accent: Accent.Secondary,
  //   action: () => {
  //     eventHandlers.handleClearTiles();
  //   },
  //   isDisabled: () => allActionsAreDisabled.value,
  //   name: window.text('game.action_clear'),
  // },
]);
</script>

<template>
  <section>
    <ul class="actions">
      <li v-for="{ name, action, accent, isDisabled } in items" :key="name">
        <button
          :class="{
            actions__btn: true,
            'actions__btn--primary': accent === Accent.Primary,
            'actions__btn--secondary': accent === Accent.Secondary,
            'actions__btn--tertiary': accent === Accent.Tertiary,
          }"
          :disabled="isDisabled()"
          @click="action()"
        >
          {{ name }}
        </button>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding: var(--space-m);
  &__btn {
    cursor: pointer;
    text-align: center;
    border-radius: var(--action-radius);
    user-select: none;
    transition-property: box-shadow;
    transition-duration: var(--transition-duration);
    transition-timing-function: var(--transition-timing-function);
    border: 1px solid transparent;
    font-size: var(--action-font-size);
    font-weight: var(--action-font-weight);
    display: grid;
    place-items: center;
    width: 5rem;
    height: 2.25rem;
    $accents: 'primary', 'secondary', 'tertiary', 'quaternary';
    @each $accent in $accents {
      &--#{$accent} {
        background: var(--action-bg-#{$accent});
        color: var(--action-color-#{$accent});
        border-color: var(--action-border-color-#{$accent});
        box-shadow: var(--shadow-xs);
        &:hover:not(:active):not(:disabled) {
          background: var(--action-bg-#{$accent}-hover);
          color: var(--action-color-#{$accent}-hover);
          border-color: var(--action-border-color-#{$accent}-hover);
          box-shadow: var(--shadow-s);
        }
        &:active:not(:disabled) {
          background: var(--action-bg-#{$accent}-active);
          color: var(--action-color-#{$accent}-active);
          border-color: var(--action-border-color-#{$accent}-active);
        }
      }
    }
    &:disabled {
      cursor: not-allowed;
      background: var(--action-bg-disabled);
      color: var(--action-color-disabled);
      border-color: var(--action-border-color-disabled);
      box-shadow: none;
    }
  }
}
</style>
