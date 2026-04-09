<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import UseButtons from '@/presentation/components/by-hierarchy/Main/MainFooter/MainFooterButtons/UseButtons.ts';
import GameTile from '@/presentation/components/shared/AppTile/AppTile.vue';
import MainStore from '@/presentation/stores/MainStore.ts';
import RackStore from '@/presentation/stores/RackStore.ts';
const mainStore = MainStore.INSTANCE();
const rackStore = RackStore.INSTANCE();
const { tilesRemaining } = storeToRefs(mainStore);
const { tiles } = storeToRefs(rackStore);
const buttons = UseButtons.create();
const { allActionsAreDisabled } = buttons;
</script>

<template>
  <ul class="rack app__limit-max-width app__create-grid--for-rack">
    <li
      v-for="(tile, idx) in tiles"
      :key="tile"
      :class="{ rack__cell: true, 'rack__cell--disabled': allActionsAreDisabled }"
      @click.stop="rackStore.handleClickFooterCell(idx)"
    >
      <GameTile
        v-if="rackStore.isTileVisible(tile)"
        :letter="mainStore.getTileLetter(tile)"
        :is-inverted="rackStore.isTileSelected(tile)"
        @click.stop="rackStore.handleClickFooterTile(tile)"
      />
    </li>
    <Transition name="fade">
      <li v-if="tilesRemaining > 0" class="rack__count app__hide-text">
        <p>
          <span v-animate-number="{ number: tilesRemaining }" class="rack__count-item" />
          {{ t('game.unassigned_count') }}
        </p>
      </li>
    </Transition>
  </ul>
</template>

<style lang="scss" scoped>
.rack {
  &__cell {
    cursor: pointer;
    background: var(--cell-bg-footer);
    border-radius: calc(var(--base-border-radius) * 2);
    box-shadow: var(--cell-shadow-footer);
    &--disabled {
      opacity: var(--opacity-disabled);
      cursor: not-allowed;
      & > * {
        pointer-events: none;
      }
    }
  }
  &__count {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    user-select: none;
  }
}
</style>
