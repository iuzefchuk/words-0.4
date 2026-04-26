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
    accent: Accent.Tertiary,
    action: () => {
      void eventHandlers.handleResign();
    },
    isDisabled: () => allActionsAreDisabled.value,
    isRendered: () => true,
    name: window.text('game.action_resign'),
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
      eventHandlers.handleShuffle();
    },
    isDisabled: () => allActionsAreDisabled.value,
    name: window.text('game.action_shuffle'),
  },
  {
    accent: Accent.Primary,
    action: () => {
      eventHandlers.handleSave();
    },
    isDisabled: () => allActionsAreDisabled.value || !mainStore.currentTurnIsValid,
    name: window.text('game.action_play'),
  },
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
  <div class="buttons">
    <ul class="buttons__list app__limit-max-width app__btn">
      <li v-for="{ name, action, accent, isDisabled } in items" :key="name">
        <button
          :class="{
            buttons__btn: true,
            'buttons__btn--primary': accent === Accent.Primary,
            'buttons__btn--secondary': accent === Accent.Secondary,
            'buttons__btn--tertiary': accent === Accent.Tertiary,
          }"
          :disabled="isDisabled()"
          @click="action()"
        >
          {{ name }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.buttons {
  width: 100%;
  display: grid;
  place-items: center;
  &__list {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    gap: var(--space-m);
  }
  &__btn {
    cursor: pointer;
    text-align: center;
    border-radius: var(--btn-radius);
    user-select: none;
    transition-property: box-shadow;
    transition-duration: var(--transition-duration);
    transition-timing-function: var(--transition-timing-function);
    border: 1px solid transparent;
    font-size: var(--btn-font-size);
    font-weight: var(--btn-font-weight);
    display: grid;
    place-items: center;
    width: 6rem;
    height: 2.75rem;
    text-transform: uppercase;
    $accents: 'primary', 'secondary', 'tertiary', 'quaternary';
    @each $accent in $accents {
      &--#{$accent} {
        background: var(--btn-bg-#{$accent});
        color: var(--btn-color-#{$accent});
        border-color: var(--btn-border-color-#{$accent});
        box-shadow: var(--shadow-s);
        &:hover:not(:active):not(:disabled) {
          background: var(--btn-bg-#{$accent}-hover);
          color: var(--btn-color-#{$accent}-hover);
          border-color: var(--btn-border-color-#{$accent}-hover);
          box-shadow: var(--shadow-m);
        }
        &:active:not(:disabled) {
          background: var(--btn-bg-#{$accent}-active);
          color: var(--btn-color-#{$accent}-active);
          border-color: var(--btn-border-color-#{$accent}-active);
          box-shadow: var(--shadow-xs);
        }
        &:disabled {
          cursor: not-allowed;
          background: var(--btn-bg-#{$accent}-disabled);
          color: var(--btn-color-#{$accent}-disabled);
          border-color: var(--btn-border-color-#{$accent}-disabled);
          box-shadow: none;
        }
      }
    }
  }
}
</style>
