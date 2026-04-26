<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { GameTile } from '@/application/types/index.ts';
import AppTile from '@/interface/components/shared/AppTile/AppTile.vue';
import UseEventHandlers from '@/interface/composables/UseEventHandlers.ts';
import { Accent } from '@/interface/enums.ts';
import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';
const eventHandlers = UseEventHandlers.create();
const mainStore = MainStore.INSTANCE();
const userStore = UserStore.INSTANCE();
const { allActionsAreDisabled, tilesRemaining } = storeToRefs(mainStore);
const { tiles } = storeToRefs(userStore);
const paddedTiles = computed<Array<GameTile | null>>(() => {
  const result: Array<GameTile | null> = [...tiles.value];
  while (result.length < mainStore.tilesPerPlayer) result.push(null);
  return result;
});
</script>

<template>
  <ul class="rack app__limit-max-width app__create-grid--for-rack">
    <Transition name="fade">
      <li v-if="tilesRemaining > 0" class="rack__count app__make-secondary">
        <p>
          <span v-animate-number="{ number: tilesRemaining }" class="rack__count-item" /> /
        </p>
      </li>
    </Transition>
    <li
      v-for="(tile, idx) in paddedTiles"
      :key="idx"
      :class="{ rack__cell: true, 'rack__cell--disabled': allActionsAreDisabled }"
      @click.stop="tile !== null && eventHandlers.handleClickRackCell(idx)"
    >
      <AppTile
        v-if="tile !== null && userStore.isTileInRack(tile) && !mainStore.isTilePlaced(tile)"
        :letter="mainStore.getTileLetter(tile)"
        :accent="userStore.isTileSelected(tile) ? Accent.Primary : Accent.Tertiary"
        @click.stop="eventHandlers.handleClickRackTile(tile)"
      />
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.rack {
  &__cell {
    cursor: pointer;
    background: var(--rack-bg);
    border-radius: calc(var(--grid-item-radius) * 2);
    box-shadow: var(--rack-shadow);
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
    align-items: flex-end;
    justify-content: flex-start;
    user-select: none;
    padding: 0 var(--space-3xs);
  }
}
</style>
